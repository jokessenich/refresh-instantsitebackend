// src/services/generation-pipeline.service.ts

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateSiteHtml } from "./claude.service";
import { validateGeneratedHtml, validateStaticFileMap } from "./validation.service";
import { deployToVercel } from "./vercel-deploy.service";
import type { SiteRequestInput, BusinessType } from "@/types/site-request";

// ─── Types ──────────────────────────────────────────────

interface UploadedImage {
  name: string;
  type: string;
  dataUrl: string;
}

interface PipelineImages {
  logoFile?: UploadedImage;
  imageFiles?: UploadedImage[];
}

// ─── Status Update Helper ───────────────────────────────

type PipelineStatus = "QUEUED" | "GENERATING" | "VALIDATING" | "GENERATED" | "DEPLOYING" | "READY" | "FAILED";

async function updateStatus(requestId: string, status: PipelineStatus, errorMessage?: string) {
  await prisma.siteRequest.update({
    where: { id: requestId },
    data: { status, errorMessage: errorMessage ?? null, updatedAt: new Date() },
  });
}

// ─── Image Helpers ──────────────────────────────────────

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

function getExtension(mimeType: string, fileName: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/gif": ".gif",
  };
  if (mimeMap[mimeType]) return mimeMap[mimeType];
  const ext = fileName.split(".").pop();
  return ext ? `.${ext}` : ".png";
}

function buildImageAssets(images: PipelineImages): {
  fileMap: Map<string, Buffer>;
  fileNames: string[];
} {
  const fileMap = new Map<string, Buffer>();
  const fileNames: string[] = [];

  if (images.logoFile && images.logoFile.dataUrl) {
    const ext = getExtension(images.logoFile.type, images.logoFile.name);
    const fileName = `logo${ext}`;
    const buffer = dataUrlToBuffer(images.logoFile.dataUrl);
    if (buffer) {
      fileMap.set(fileName, buffer);
      fileNames.push(fileName);
    }
  }

  if (images.imageFiles) {
    images.imageFiles
      .filter((img) => img && img.dataUrl)
      .slice(0, 5)
      .forEach((img, i) => {
        const ext = getExtension(img.type, img.name);
        const fileName = `image-${i + 1}${ext}`;
        const buffer = dataUrlToBuffer(img.dataUrl);
        if (buffer) {
          fileMap.set(fileName, buffer);
          fileNames.push(fileName);
        }
      });
  }

  return { fileMap, fileNames };
}

// ─── Full Pipeline: Generate + Deploy ───────────────────

export async function runFullPipeline(
  requestId: string,
  images: PipelineImages = {}
): Promise<{ previewUrl: string; deploymentId: string }> {
  try {
    // ── 1. Load site request ────────────────────────────
    await updateStatus(requestId, "GENERATING");

    const request = await prisma.siteRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    logger.info("Starting full pipeline", {
      requestId,
      businessType: request.businessType,
      hasLogo: !!images.logoFile,
      imageCount: images.imageFiles?.length ?? 0,
    });

    // ── 2. Process images ───────────────────────────────
    const { fileMap: imageBuffers, fileNames } = buildImageAssets(images);

    logger.info("Images processed", {
      requestId,
      fileNames,
      totalBytes: Array.from(imageBuffers.values()).reduce((sum, b) => sum + b.byteLength, 0),
    });

    // ── 3. Build input for Claude ───────────────────────
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
      uploadedImageIds: [],
      uploadedLogoId: undefined,
    };

    // ── 4. Generate HTML with Claude ────────────────────
    const html = await generateSiteHtml(input, fileNames);

    // ── 5. Validate HTML ────────────────────────────────
    await updateStatus(requestId, "VALIDATING");

    const validation = validateGeneratedHtml(html);
    if (!validation.valid) {
      const errorMsg = `Validation failed: ${validation.errors.join("; ")}`;
      await updateStatus(requestId, "FAILED", errorMsg);
      throw new Error(errorMsg);
    }

    // ── 6. Store generated site ─────────────────────────
    const generatedSite = await prisma.generatedSite.create({
      data: {
        siteRequestId: requestId,
        generatedContent: { html },
        templateId: "static-html-v1",
        themeTokens: {},
      },
    });

    await updateStatus(requestId, "DEPLOYING");

   // ── 7. Store deployment record (self-hosted) ────────
    const previewUrl = `https://app.better.website/sites/${requestId}`;

    await prisma.deployment.create({
      data: {
        siteRequestId: requestId,
        previewUrl,
        deploymentUrl: previewUrl,
        status: "READY",
        deployedAt: new Date(),
      },
    });

    await updateStatus(requestId, "READY");

    logger.info("Full pipeline complete", {
      requestId,
      previewUrl,
    });

    return {
      previewUrl,
      deploymentId: requestId,
    };

