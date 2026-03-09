// src/services/upload.service.ts

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { UploadInput } from "@/types/site-request";

/**
 * V1 upload handling. In production, this would:
 * 1. Generate a presigned S3 URL for direct client upload
 * 2. Store the asset record
 * 3. Return the presigned URL + asset ID
 *
 * For V1, we store the record and return a placeholder.
 * The actual S3 integration is a thin wrapper over @aws-sdk/client-s3.
 */

export interface UploadResult {
  assetId: string;
  uploadUrl: string; // presigned URL for client upload
  publicUrl: string; // where the asset will be accessible after upload
}

export async function createUpload(
  userId: string,
  input: UploadInput,
  siteRequestId?: string
): Promise<UploadResult> {
  const storageKey = `uploads/${userId}/${Date.now()}-${sanitizeFileName(input.fileName)}`;

  const asset = await prisma.uploadedAsset.create({
    data: {
      userId,
      siteRequestId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      assetType: input.assetType,
      storageKey,
      // In production: generate presigned URL from S3
      publicUrl: `https://assets.simplersite.com/${storageKey}`,
    },
  });

  logger.info("Upload record created", {
    assetId: asset.id,
    fileName: input.fileName,
    assetType: input.assetType,
  });

  // In production, generate a presigned S3 PUT URL here
  const uploadUrl = `https://s3.placeholder.com/presigned/${storageKey}`;

  return {
    assetId: asset.id,
    uploadUrl,
    publicUrl: asset.publicUrl!,
  };
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}
