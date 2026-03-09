// src/types/site-request.ts

import { z } from "zod";

// ─── Sanitization helpers ───────────────────────────────

/** Strip HTML tags and trim whitespace */
function sanitizeString(val: string): string {
  return val.replace(/<[^>]*>/g, "").trim();
}

const SafeString = z.string().transform(sanitizeString);
const SafeStringMax = (max: number) => z.string().max(max).transform(sanitizeString);

// ─── Business Type Enum ─────────────────────────────────

export const BusinessTypeEnum = z.enum([
  "contractor",
  "restaurant",
  "therapist",
  "consultant",
  "photographer",
  "local-service",
]);
export type BusinessType = z.infer<typeof BusinessTypeEnum>;

// ─── Site Request Input Schema ──────────────────────────

export const SiteRequestInputSchema = z.object({
  businessName: SafeStringMax(100),
  businessType: BusinessTypeEnum,
  location: SafeStringMax(200).optional(),
  primaryGoal: SafeStringMax(500),
  services: z
    .array(SafeStringMax(200))
    .min(1, "At least one service is required")
    .max(12, "Maximum 12 services"),
  about: SafeStringMax(2000),
  differentiators: z
    .array(SafeStringMax(300))
    .max(6, "Maximum 6 differentiators")
    .default([]),
  contactEmail: z.string().email(),
  contactPhone: z
    .string()
    .regex(/^[\d\s\-\+\(\)\.]+$/, "Invalid phone format")
    .optional(),
  colorPreference: SafeStringMax(100).optional(),
  fontPreference: SafeStringMax(100).optional(),
  siteVibe: SafeStringMax(200).optional(),
  uploadedImageIds: z.array(z.string().cuid()).max(10).default([]),
  uploadedLogoId: z.string().cuid().optional(),
});

export type SiteRequestInput = z.infer<typeof SiteRequestInputSchema>;

// ─── Upload Input Schema ────────────────────────────────

export const UploadInputSchema = z.object({
  fileName: z.string().max(255),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ]),
  fileSize: z.number().max(10 * 1024 * 1024, "Maximum file size is 10MB"),
  assetType: z.enum(["LOGO", "HERO_IMAGE", "GALLERY_IMAGE", "GENERAL"]).default("GENERAL"),
});

export type UploadInput = z.infer<typeof UploadInputSchema>;
