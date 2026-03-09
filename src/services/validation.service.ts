// src/services/validation.service.ts

import { GeneratedContentSchema, type GeneratedContent, ALLOWED_SECTION_TYPES } from "@/types/generated-content";
import type { DeployableFileMap } from "@/types/template";
import { logger } from "@/lib/logger";

// ─── Validate Claude Output ─────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGeneratedContent(raw: unknown): ValidationResult {
  const errors: string[] = [];

  // 1. Zod schema validation
  const result = GeneratedContentSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }
    return { valid: false, errors };
  }

  const content = result.data;

  // 2. Verify no disallowed section types
  for (const section of content.sections) {
    if (!ALLOWED_SECTION_TYPES.includes(section.type as any)) {
      errors.push(`Disallowed section type: ${section.type}`);
    }
  }

  // 3. Check for suspicious/unsafe content in text fields
  const allText = extractAllText(content);
  for (const text of allText) {
    if (containsUnsafeContent(text)) {
      errors.push(`Unsafe content detected in field value`);
    }
  }

  // 4. Verify color values are real hex codes (not something weird)
  const { theme } = content;
  const colorFields = [
    theme.primaryColor, theme.secondaryColor, theme.accentColor,
    theme.backgroundColor, theme.textColor,
  ];
  for (const color of colorFields) {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      errors.push(`Invalid color value: ${color}`);
    }
  }

  // 5. Ensure hero exists and comes first
  if (content.sections[0]?.type !== "hero") {
    errors.push("First section must be hero");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Validate File Map ──────────────────────────────────

export function validateFileMap(files: DeployableFileMap): ValidationResult {
  const errors: string[] = [];

  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
  ];

  for (const required of requiredFiles) {
    if (!files.has(required)) {
      errors.push(`Missing required file: ${required}`);
    }
  }

  // Verify package.json is valid JSON
  const pkgJson = files.get("package.json");
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson);
      if (!pkg.dependencies?.next) {
        errors.push("package.json missing next dependency");
      }
    } catch {
      errors.push("package.json is not valid JSON");
    }
  }

  // Verify no files outside allowed paths
  const allowedPrefixes = ["app/", "public/", ""];
  for (const [path] of files) {
    const prefix = path.includes("/") ? path.split("/")[0] + "/" : "";
    if (prefix && !allowedPrefixes.includes(prefix)) {
      errors.push(`File outside allowed directory: ${path}`);
    }
  }

  // Check for unreasonable file sizes
  for (const [path, content] of files) {
    if (content.length > 500_000) {
      errors.push(`File too large: ${path} (${content.length} chars)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Helpers ────────────────────────────────────────────

function extractAllText(content: GeneratedContent): string[] {
  const texts: string[] = [content.siteTitle, content.siteDescription];

  for (const section of content.sections) {
    switch (section.type) {
      case "hero":
        texts.push(section.headline, section.subheadline, section.ctaText);
        break;
      case "services":
        texts.push(section.heading, section.subheading ?? "");
        for (const item of section.items) {
          texts.push(item.title, item.description);
        }
        break;
      case "about":
        texts.push(section.heading, ...section.paragraphs);
        break;
      case "testimonials":
        texts.push(section.heading);
        for (const t of section.items) {
          texts.push(t.quote, t.author, t.role ?? "");
        }
        break;
      case "contact":
        texts.push(section.heading, section.subheading ?? "");
        break;
      case "footer":
        texts.push(section.copyrightText, section.tagline ?? "");
        break;
    }
  }

  return texts.filter(Boolean);
}

function containsUnsafeContent(text: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,      // event handlers like onclick=
    /data:text\/html/i,
    /eval\s*\(/i,
    /document\.\w+/i,
    /window\.\w+/i,
    /import\s*\(/i,
    /require\s*\(/i,
  ];
  return patterns.some((p) => p.test(text));
}
