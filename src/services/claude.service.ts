// src/services/claude.service.ts

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { SiteRequestInput } from "@/types/site-request";

// ─── Client (lazy — only instantiates on first call) ────

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ─── System Prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `You are a world class senior frontend engineer with 15 years of experience and have a world class website designer on your team.

Your task is to generate a complete small business website as a single static HTML file.

The website will be deployed directly to Vercel with no build step. You must produce a polished, production-quality website that feels modern, trustworthy, and professionally designed.

The site should feel custom to the business, not templated or generic.

Write specific, credible copy based on the business details below. Avoid bland marketing fluff, generic agency language, and overused phrases like "high-quality solutions," "tailored approach," or "customer satisfaction is our top priority."

Search for and include real, high-quality photos from Unsplash or Pexels. Never use placeholder images or leave image slots empty. 
Once you have the html, have a design council judge it — Dieter Rams, Jonathan Ive, Refik Anadol, Pentagram, Fantasy, Clay. Have them rate it on a scale of 1-10, iterate until ALL score it as 9/10+. Then self-score AI slop (1=human-designed, 10=AI slop) and iterate until under 3. Don't stop until both thresholds are met.
Technical requirements:
- Return only one complete HTML document
- Do not include Markdown
- Include all CSS inside a <style> tag in the <head>
- Use plain HTML, CSS, and minimal JavaScript only if truly necessary
- Make the site fully mobile responsive
- Use semantic HTML
- Do not use external frameworks

CRITICAL: Return ONLY the HTML. No explanation, no markdown code fences, no commentary before or after. Start with <!DOCTYPE html> and end with </html>.`;

// ─── Prompt Builder ─────────────────────────────────────

export function buildPrompt(input: SiteRequestInput, imageFileNames?: string[]): string {
  const hasImages = imageFileNames && imageFileNames.length > 0;
  const logoFile = imageFileNames?.find((f) => f.startsWith("logo"));
  const otherImages = imageFileNames?.filter((f) => !f.startsWith("logo")) || [];

  let imageSection: string;

  if (hasImages) {
    const parts: string[] = [];
    if (logoFile) {
      parts.push(`Logo: Use <img src="/${logoFile}"> for the business logo in the header/nav. Style it appropriately (reasonable height, no distortion).`);
    }
    if (otherImages.length > 0) {
      const imgTags = otherImages.map((f) => `<img src="/${f}">`).join(", ");
      parts.push(`Business photos: Use these images throughout the site in hero sections, about sections, or gallery areas: ${imgTags}. Make the images look great — use object-fit: cover, appropriate sizing, and good placement.`);
    }
    imageSection = `Images Provided:
${parts.join("\n")}

IMPORTANT: These image files will be deployed alongside the HTML. Reference them with a leading slash (e.g. src="/logo.png", src="/image-1.jpg"). Do NOT use base64, external URLs, or placeholder images. Use ONLY the provided image files listed above.`;
  } else {
    imageSection = `Images Provided:
None (use CSS gradients, patterns, or solid colors for visual interest instead. Do NOT use placeholder image URLs or broken image references.)`;
  }

  return `The business details are below:

Business Name:
${input.businessName}

Business Type:
${input.businessType}

Location:
${input.location ?? "Not specified"}

Primary Goal:
${input.primaryGoal}

Services:
${input.services.join(", ")}

About the Business:
${input.about}

Key Differentiators:
${input.differentiators.length > 0 ? input.differentiators.join(", ") : "Not specified"}

Contact Email:
${input.contactEmail}

Contact Phone:
${input.contactPhone ?? "Not provided"}

Design Preferences:

Primary Colors:
${input.colorPreference ?? "Use tasteful, professional colors appropriate for the business type"}

Style Direction:
${input.fontPreference ?? "Modern and clean"}

Overall Vibe:
${input.siteVibe ?? "Professional and trustworthy"}

${imageSection}

Tone:
Professional but approachable — specific to the business type

Encourage the visitor to take the primary action:
${input.primaryGoal}`;
}

// ─── Generate HTML ──────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateSiteHtml(
  input: SiteRequestInput,
  imageFileNames?: string[]
): Promise<string> {
  const prompt = buildPrompt(input, imageFileNames);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.info("Retrying Claude generation", { attempt });
        await sleep(RETRY_DELAY_MS * attempt);
      }

      const response = await getClient().messages.create({
        model: "claude-opus-4-6",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      let html = textBlock.text.trim();

      // Strip markdown fences if Claude wraps them despite instructions
      if (html.startsWith("```")) {
        html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
      }

      // Basic validation
      if (!html.toLowerCase().startsWith("<!doctype html>")) {
        throw new Error("Claude response does not start with <!DOCTYPE html>");
      }

      if (!html.includes("</html>")) {
        throw new Error("Claude response does not contain closing </html> tag");
      }

      logger.info("Claude HTML generation successful", {
        businessName: input.businessName,
        htmlLength: html.length,
        attempt,
        imageCount: imageFileNames?.length ?? 0,
      });

      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn("Claude generation attempt failed", {
        attempt,
        error: lastError.message,
      });
    }
  }

  throw new Error(`Claude generation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}
