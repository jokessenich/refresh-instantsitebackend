// src/services/claude.service.ts

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  GeneratedContentSchema,
  type GeneratedContent,
  ALLOWED_SECTION_TYPES,
} from "@/types/generated-content";
import type { VerticalTemplate } from "@/types/template";
import type { SiteRequestInput } from "@/types/site-request";

// ─── Client ─────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ─── System Prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional website copywriter and content architect.
Your job is to generate structured JSON content for a small business website.

RULES:
- You ONLY output valid JSON. No markdown, no explanation, no code fences.
- You generate content for a fixed set of website sections.
- You NEVER generate HTML, CSS, JavaScript, or any code.
- You NEVER include harmful, offensive, or inappropriate content.
- Your content should be professional, compelling, and specific to the business.
- Testimonials should be realistic placeholder testimonials (mark them clearly as examples).
- All text must be concise and web-appropriate — no walls of text.
- The JSON must exactly match the schema provided.

ALLOWED SECTION TYPES: ${ALLOWED_SECTION_TYPES.join(", ")}

COLOR VALUES: Must be valid 6-digit hex codes like #1B3A4B.
FONTS: Must be from the allowed list provided in the prompt.`;

// ─── Prompt Builder ─────────────────────────────────────

export function buildPrompt(
  input: SiteRequestInput,
  template: VerticalTemplate,
  themeHints: string
): string {
  return `Generate website content for the following business:

BUSINESS NAME: ${input.businessName}
BUSINESS TYPE: ${input.businessType}
LOCATION: ${input.location ?? "Not specified"}
PRIMARY GOAL: ${input.primaryGoal}
SERVICES: ${input.services.join(", ")}
ABOUT: ${input.about}
DIFFERENTIATORS: ${input.differentiators.join(", ") || "None specified"}
CONTACT EMAIL: ${input.contactEmail}
CONTACT PHONE: ${input.contactPhone ?? "Not provided"}
SITE VIBE: ${input.siteVibe ?? "Professional and trustworthy"}

TEMPLATE: ${template.name}
DEFAULT SECTION ORDER: ${template.defaultSections.join(", ")}
ALLOWED FONTS: ${template.allowedFonts.join(", ")}
DEFAULT THEME: ${JSON.stringify(template.defaultTheme)}

${themeHints ? `THEME CUSTOMIZATION: ${themeHints}` : ""}

${template.promptHints}

OUTPUT INSTRUCTIONS:
Return a single JSON object with this exact structure:
{
  "siteTitle": "string (max 100 chars)",
  "siteDescription": "string (max 200 chars, for SEO meta description)",
  "theme": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "backgroundColor": "#hex",
    "textColor": "#hex",
    "headingFont": "Font Name (from allowed list)",
    "bodyFont": "Font Name (from allowed list)"
  },
  "sections": [
    {
      "type": "hero",
      "headline": "string (max 120 chars)",
      "subheadline": "string (max 250 chars)",
      "ctaText": "string (max 40 chars)",
      "ctaUrl": "#contact"
    },
    {
      "type": "services",
      "heading": "string",
      "subheading": "string (optional)",
      "items": [{ "title": "string", "description": "string", "icon": "lucide-icon-name (optional)" }]
    },
    {
      "type": "about",
      "heading": "string",
      "paragraphs": ["string"],
      "highlightStats": [{ "value": "string", "label": "string" }]
    },
    {
      "type": "testimonials",
      "heading": "string",
      "items": [{ "quote": "string", "author": "string", "role": "string (optional)" }]
    },
    {
      "type": "contact",
      "heading": "string",
      "subheading": "string (optional)",
      "formFields": ["name", "email", "phone", "message"]
    },
    {
      "type": "footer",
      "copyrightText": "string",
      "tagline": "string (optional)"
    }
  ],
  "navItems": [{ "label": "string", "href": "#section-id" }]
}

Include all sections from the default order. Generate 3 testimonials as realistic placeholders. Output ONLY the JSON object.`;
}

// ─── Claude Client Wrapper ──────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateContent(
  input: SiteRequestInput,
  template: VerticalTemplate,
  themeHints: string
): Promise<GeneratedContent> {
  const prompt = buildPrompt(input, template, themeHints);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.info("Retrying Claude generation", { attempt });
        await sleep(RETRY_DELAY_MS * attempt);
      }

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      const rawText = textBlock.text.trim();
      const parsed = parseClaudeJson(rawText);
      const validated = validateClaudeOutput(parsed);

      logger.info("Claude generation successful", {
        siteTitle: validated.siteTitle,
        sectionCount: validated.sections.length,
        attempt,
      });

      return validated;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn("Claude generation attempt failed", {
        attempt,
        error: lastError.message,
      });

      // Don't retry on validation errors — they won't fix themselves
      if (lastError.message.includes("validation")) {
        break;
      }
    }
  }

  throw new Error(`Claude generation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

// ─── Response Parsing ───────────────────────────────────

function parseClaudeJson(raw: string): unknown {
  // Strip markdown code fences if Claude wraps them despite instructions
  let cleaned = raw;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude JSON output: ${cleaned.slice(0, 200)}...`);
  }
}

function validateClaudeOutput(parsed: unknown): GeneratedContent {
  const result = GeneratedContentSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Claude output validation failed: ${issues}`);
  }
  return result.data;
}
