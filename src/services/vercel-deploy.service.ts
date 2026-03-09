// src/services/vercel-deploy.service.ts

import crypto from "crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { DeployableFileMap } from "@/types/template";
import type { DeploymentResult } from "@/types/deployment";

// ─── Types ──────────────────────────────────────────────

interface VercelFile {
  file: string;
  sha: string;
  size: number;
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
const DEPLOY_TIMEOUT_MS = 300_000; // 5 minutes
const POLL_INTERVAL_MS = 5_000;

// ─── Deploy Files to Vercel ─────────────────────────────

export async function deployToVercel(
  files: DeployableFileMap,
  projectName: string
): Promise<DeploymentResult> {
  const headers = buildHeaders();
  const teamQuery = env.VERCEL_TEAM_ID ? `?teamId=${env.VERCEL_TEAM_ID}` : "";

  // Step 1: Prepare file list with SHA hashes
  const fileEntries = prepareFiles(files);

  // Step 2: Upload all files
  await uploadFiles(files, fileEntries, headers);

  // Step 3: Create deployment
  const deployment = await createDeployment(fileEntries, projectName, headers, teamQuery);

  logger.info("Vercel deployment created", {
    deploymentId: deployment.id,
    url: deployment.url,
  });

  // Step 4: Disable deployment protection so the site is publicly accessible
  await disableDeploymentProtection(projectName, headers, teamQuery);

  // Step 5: Wait for deployment to be ready
  await waitForReady(deployment.id, headers, teamQuery);

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
      if (response.status === 409) return; // already exists
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
  headers: Record<string, string>,
  teamQuery: string
): Promise<VercelDeploymentResponse> {
  const body = {
    name: projectName,
    files: files.map((f) => ({
      file: f.file,
      sha: f.sha,
      size: f.size,
    })),
    projectSettings: {
      framework: null,
    },
    target: "production",
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

// ─── Disable Deployment Protection ──────────────────────

async function disableDeploymentProtection(
  projectName: string,
  headers: Record<string, string>,
  teamQuery: string
): Promise<void> {
  try {
    // First try to update project settings to remove protection
    const response = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${projectName}${teamQuery}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ssoProtection: null,
          vercelAuthentication: { deploymentType: "none" },
        }),
      }
    );

    if (response.ok) {
      logger.info("Deployment protection disabled", { projectName });
    } else {
      const body = await response.text();
      logger.warn("Failed to disable deployment protection", {
        projectName,
        status: response.status,
        body,
      });
    }
  } catch (error) {
    logger.warn("Could not update deployment protection settings", {
      projectName,
      error: error instanceof Error ? error.message : "Unknown",
    });
  }
}

// ─── Poll for Ready State ───────────────────────────────

async function waitForReady(
  deploymentId: string,
  headers: Record<string, string>,
  teamQuery: string
): Promise<string> {
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
