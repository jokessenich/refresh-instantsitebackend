// src/services/vercel-deploy.service.ts

import crypto from "crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { DeployableFileMap } from "@/types/template";
import type { DeploymentResult } from "@/types/deployment";

// ─── Types ──────────────────────────────────────────────

interface VercelFile {
  file: string;   // relative path
  sha: string;    // SHA-1 hash of content
  size: number;   // byte length
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: string;
  alias?: string[];
  meta?: Record<string, string>;
}

// ─── Constants ──────────────────────────────────────────

const VERCEL_API_BASE = "https://api.vercel.com";
const DEPLOY_TIMEOUT_MS = 120_000; // 2 minutes
const POLL_INTERVAL_MS = 5_000;

// ─── Deploy Files to Vercel ─────────────────────────────

/**
 * Deploys a set of in-memory files directly to Vercel using the REST API.
 *
 * Flow:
 * 1. Compute SHA-1 hash for each file
 * 2. Upload each file to Vercel's blob store
 * 3. Create a deployment referencing those files
 * 4. Poll until deployment is ready (or timeout)
 * 5. Return the deployment URL
 */
export async function deployToVercel(
  files: DeployableFileMap,
  projectName: string
): Promise<DeploymentResult> {
  const headers = buildHeaders();

  // Step 1: Prepare file list with SHA hashes
  const fileEntries = prepareFiles(files);

  // Step 2: Upload all files
  await uploadFiles(files, fileEntries, headers);

  // Step 3: Create deployment
  const deployment = await createDeployment(fileEntries, projectName, headers);

  logger.info("Vercel deployment created", {
    deploymentId: deployment.id,
    url: deployment.url,
  });

  // Step 4: Wait for deployment to be ready
  const finalState = await waitForReady(deployment.id, headers);

  return {
    deploymentId: deployment.id,
    deploymentUrl: `https://${deployment.url}`,
    previewUrl: `https://${deployment.url}`,
    projectId: projectName,
  };
}

// ─── Prepare Files ──────────────────────────────────────

function prepareFiles(files: DeployableFileMap): VercelFile[] {
  const entries: VercelFile[] = [];

  for (const [filePath, content] of files) {
    const buffer = Buffer.from(content, "utf-8");
    const sha = crypto.createHash("sha1").update(buffer).digest("hex");

    entries.push({
      file: filePath,
      sha,
      size: buffer.byteLength,
    });
  }

  return entries;
}

// ─── Upload Files ───────────────────────────────────────

async function uploadFiles(
  files: DeployableFileMap,
  entries: VercelFile[],
  headers: Record<string, string>
): Promise<void> {
  // Vercel's upload endpoint accepts individual files
  // POST https://api.vercel.com/v2/files
  // Headers: x-vercel-digest: <sha>, Content-Length: <size>
  // Body: raw file content

  const uploadPromises = entries.map(async (entry) => {
    const content = files.get(entry.file);
    if (!content) throw new Error(`File content missing: ${entry.file}`);

    const buffer = Buffer.from(content, "utf-8");

    const response = await fetch(`${VERCEL_API_BASE}/v2/files`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "x-vercel-digest": entry.sha,
      },
      body: buffer,
    });

    if (!response.ok) {
      // 409 = already exists, which is fine
      if (response.status === 409) return;

      const body = await response.text();
      throw new Error(`File upload failed for ${entry.file}: ${response.status} ${body}`);
    }

    logger.debug("Uploaded file to Vercel", { file: entry.file, sha: entry.sha });
  });

  await Promise.all(uploadPromises);
  logger.info("All files uploaded to Vercel", { fileCount: entries.length });
}

// ─── Create Deployment ──────────────────────────────────

async function createDeployment(
  files: VercelFile[],
  projectName: string,
  headers: Record<string, string>
): Promise<VercelDeploymentResponse> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : "";

  const body = {
    name: projectName,
    files: files.map((f) => ({
      file: f.file,
      sha: f.sha,
      size: f.size,
    })),
    projectSettings: {
      framework: "nextjs",
      buildCommand: "next build",
      outputDirectory: ".next",
      installCommand: "npm install",
    },
    target: "preview", // Preview deployment, not production
  };

  const response = await fetch(
    `${VERCEL_API_BASE}/v13/deployments${teamQuery}`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Deployment creation failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as VercelDeploymentResponse;
  return data;
}

// ─── Poll for Ready State ───────────────────────────────

async function waitForReady(
  deploymentId: string,
  headers: Record<string, string>
): Promise<string> {
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : "";
  const startTime = Date.now();

  while (Date.now() - startTime < DEPLOY_TIMEOUT_MS) {
    const response = await fetch(
      `${VERCEL_API_BASE}/v13/deployments/${deploymentId}${teamQuery}`,
      { headers }
    );

    if (!response.ok) {
      logger.warn("Failed to poll deployment status", {
        deploymentId,
        status: response.status,
      });
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    const data = (await response.json()) as { readyState: string; url: string };

    switch (data.readyState) {
      case "READY":
        logger.info("Deployment is ready", { deploymentId, url: data.url });
        return data.readyState;
      case "ERROR":
      case "CANCELED":
        throw new Error(`Deployment ${deploymentId} ended with state: ${data.readyState}`);
      default:
        // BUILDING, QUEUED, INITIALIZING — keep waiting
        logger.debug("Deployment still building", {
          deploymentId,
          state: data.readyState,
        });
        await sleep(POLL_INTERVAL_MS);
    }
  }

  throw new Error(`Deployment ${deploymentId} timed out after ${DEPLOY_TIMEOUT_MS / 1000}s`);
}

// ─── Helpers ────────────────────────────────────────────

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.VERCEL_TOKEN}`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
