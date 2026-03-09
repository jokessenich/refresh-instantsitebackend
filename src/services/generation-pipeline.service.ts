// src/services/generation-pipeline.service.ts

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getTemplate, resolveTheme } from "./template.service";
import { generateContent } from "./claude.service";
import { validateGeneratedContent, validateFileMap } from "./validation.service";
import { assembleDeployableFiles } from "./file-assembly.service";
import { deployToVercel } from "./vercel-deploy.service";
import type { SiteRequestInput, BusinessType } from "@/types/site-request";
import type { DeployableFileMap, AssemblyContext } from "@/types/template";
import type { GeneratedContent } from "@/types/generated-content";

// ─── Status Update Helper ───────────────────────────────

type PipelineStatus = "QUEUED" | "GENERATING" | "VALIDATING" | "GENERATED" | "DEPLOYING" | "READY" | "FAILED";

async function updateStatus(requestId: string, status: PipelineStatus, errorMessage?: string) {
  await prisma.siteRequest.update({
    where: { id: requestId },
    data: { status, errorMessage: errorMessage ?? null, updatedAt: new Date() },
  });
}

// ─── Generate Site Content ──────────────────────────────

export async function runGenerationPipeline(requestId: string): Promise<{
  content: GeneratedContent;
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

    // 2. Select template
    const template = getTemplate(request.businessType.toLowerCase() as BusinessType);
    const { themeHints } = resolveTheme(
      template,
      request.colorPreference ?? undefined,
      request.fontPreference ?? undefined
    );

    // 3. Build input for Claude
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
    };

    // 4. Generate content with Claude
    const content = await generateContent(input, template, themeHints);

    // 5. Validate output
    await updateStatus(requestId, "VALIDATING");

    const validation = validateGeneratedContent(content);
    if (!validation.valid) {
      const errorMsg = `Validation failed: ${validation.errors.join("; ")}`;
      await updateStatus(requestId, "FAILED", errorMsg);
      throw new Error(errorMsg);
    }

    // 6. Store generated site
    const generatedSite = await prisma.generatedSite.create({
      data: {
        siteRequestId: requestId,
        generatedContent: content as any,
        templateId: template.id,
        themeTokens: content.theme as any,
      },
    });

    await updateStatus(requestId, "GENERATED");

    logger.info("Generation pipeline complete", {
      requestId,
      siteId: generatedSite.id,
    });

    return { content, siteId: generatedSite.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown generation error";
    logger.error("Generation pipeline failed", { requestId, error: msg });

    // Only update to FAILED if we haven't already
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
      include: { generatedSite: true, uploadedAssets: true },
    });

    if (!request.generatedSite) {
      throw new Error("Site must be generated before deployment");
    }

    const content = request.generatedSite.generatedContent as unknown as GeneratedContent;
    const template = getTemplate(request.businessType.toLowerCase() as BusinessType);

    // 2. Assemble deployable files
    const assemblyCtx: AssemblyContext = {
      template,
      content,
      businessName: request.businessName,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone ?? undefined,
      logoUrl: request.uploadedAssets.find((a) => a.assetType === "LOGO")?.publicUrl ?? undefined,
      imageUrls: request.uploadedAssets
        .filter((a) => a.assetType !== "LOGO")
        .map((a) => a.publicUrl)
        .filter((url): url is string => !!url),
    };

    const files = assembleDeployableFiles(assemblyCtx);

    // 3. Validate file map
    const fileValidation = validateFileMap(files);
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
