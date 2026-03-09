// src/services/generation-pipeline.service.ts

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateSiteHtml } from "./claude.service";
import { validateGeneratedHtml, validateStaticFileMap } from "./validation.service";
import { deployToVercel } from "./vercel-deploy.service";
import type { SiteRequestInput, BusinessType } from "@/types/site-request";

// ─── Status Update Helper ───────────────────────────────

type PipelineStatus = "QUEUED" | "GENERATING" | "VALIDATING" | "GENERATED" | "DEPLOYING" | "READY" | "FAILED";

async function updateStatus(requestId: string, status: PipelineStatus, errorMessage?: string) {
  await prisma.siteRequest.update({
    where: { id: requestId },
    data: { status, errorMessage: errorMessage ?? null, updatedAt: new Date() },
  });
}

// ─── Generate Site HTML ─────────────────────────────────

export async function runGenerationPipeline(requestId: string): Promise<{
  html: string;
  siteId: string;
}> {
  try {
    // 1. Load site request
    await updateStatus(requestId, "GENERATING");

    const request = await prisma.siteRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { uploadedAssets: true },
    });

    logger.info("Starting generation pipeline", {
      requestId,
      businessType: request.businessType,
    });

    // 2. Build input for Claude
    const input: SiteRequestInput = {
      businessName: request.businessName,
      businessType: request.businessType.toLowerCase() as BusinessType,
      location: request.location ?? undefined,
      primaryGoal: request.primaryGoal,
      services: request.services,
      about: request.about,
      differentiators: request.differentiators,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone ?? undefined,
      colorPreference: request.colorPreference ?? undefined,
      fontPreference: request.fontPreference ?? undefined,
      siteVibe: request.siteVibe ?? undefined,
      uploadedImageIds: request.uploadedAssets
        .filter((a) => a.assetType !== "LOGO")
        .map((a) => a.id),
      uploadedLogoId: request.uploadedAssets.find((a) => a.assetType === "LOGO")?.id,
    };

    // 3. Generate HTML with Claude
    const html = await generateSiteHtml(input);

    // 4. Validate output
    await updateStatus(requestId, "VALIDATING");

    const validation = validateGeneratedHtml(html);
    if (!validation.valid) {
      const errorMsg = `Validation failed: ${validation.errors.join("; ")}`;
      await updateStatus(requestId, "FAILED", errorMsg);
      throw new Error(errorMsg);
    }

    // 5. Store generated site
    const generatedSite = await prisma.generatedSite.create({
      data: {
        siteRequestId: requestId,
        generatedContent: { html },
        templateId: "static-html-v1",
        themeTokens: {},
      },
    });

    await updateStatus(requestId, "GENERATED");

    logger.info("Generation pipeline complete", {
      requestId,
      siteId: generatedSite.id,
      htmlLength: html.length,
    });

    return { html, siteId: generatedSite.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown generation error";
    logger.error("Generation pipeline failed", { requestId, error: msg });

    const current = await prisma.siteRequest.findUnique({ where: { id: requestId } });
    if (current && current.status !== "FAILED") {
      await updateStatus(requestId, "FAILED", msg);
    }

    throw error;
  }
}

// ─── Deploy Generated Site ──────────────────────────────

export async function runDeploymentPipeline(requestId: string): Promise<{
  previewUrl: string;
  deploymentId: string;
}> {
  try {
    await updateStatus(requestId, "DEPLOYING");

    // 1. Load request + generated site
    const request = await prisma.siteRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { generatedSite: true },
    });

    if (!request.generatedSite) {
      throw new Error("Site must be generated before deployment");
    }

    const stored = request.generatedSite.generatedContent as any;
    const html = stored.html as string;

    if (!html) {
      throw new Error("No HTML content found in generated site");
    }

    // 2. Build static file map — just index.html for a static site
    const files = new Map<string, string>();
    files.set("index.html", html);

    // 3. Validate file map
    const fileValidation = validateStaticFileMap(files);
    if (!fileValidation.valid) {
      const errorMsg = `File validation failed: ${fileValidation.errors.join("; ")}`;
      await updateStatus(requestId, "FAILED", errorMsg);
      throw new Error(errorMsg);
    }

    // 4. Store file manifest
    const manifest: Record<string, number> = {};
    for (const [path, content] of files) {
      manifest[path] = content.length;
    }
    await prisma.generatedSite.update({
      where: { id: request.generatedSite.id },
      data: { fileManifest: manifest, assembledAt: new Date() },
    });

    // 5. Deploy to Vercel
    const projectName = `ss-${slugify(request.businessName)}-${requestId.slice(0, 8)}`;
    const result = await deployToVercel(files, projectName);

    // 6. Store deployment record
    await prisma.deployment.create({
      data: {
        siteRequestId: requestId,
        vercelDeploymentId: result.deploymentId,
        vercelProjectId: result.projectId,
        previewUrl: result.previewUrl,
        deploymentUrl: result.deploymentUrl,
        status: "READY",
        deployedAt: new Date(),
      },
    });

    await updateStatus(requestId, "READY");

    logger.info("Deployment pipeline complete", {
      requestId,
      previewUrl: result.previewUrl,
    });

    return {
      previewUrl: result.previewUrl,
      deploymentId: result.deploymentId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown deployment error";
    logger.error("Deployment pipeline failed", { requestId, error: msg });

    const current = await prisma.siteRequest.findUnique({ where: { id: requestId } });
    if (current && current.status !== "FAILED") {
      await updateStatus(requestId, "FAILED", msg);
    }

    throw error;
  }
}

// ─── Helper ─────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
}
