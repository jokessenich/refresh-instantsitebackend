// src/services/validation.service.ts

import { logger } from "@/lib/logger";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Validate Generated HTML ────────────────────────────

export function validateGeneratedHtml(html: string): ValidationResult {
  const errors: string[] = [];

  // 1. Must be a complete HTML document
  if (!html.toLowerCase().includes("<!doctype html>")) {
    errors.push("Missing <!DOCTYPE html> declaration");
  }

  if (!html.includes("<html")) {
    errors.push("Missing <html> tag");
  }

  if (!html.includes("</html>")) {
    errors.push("Missing closing </html> tag");
  }

  if (!html.includes("<head>") || !html.includes("</head>")) {
    errors.push("Missing <head> section");
  }

  if (!html.includes("<body") || !html.includes("</body>")) {
    errors.push("Missing <body> section");
  }

  // 2. Must have inline styles (no external CSS)
  if (!html.includes("<style")) {
    errors.push("Missing <style> tag — CSS must be inline");
  }

  // 3. Check for dangerous content
  const dangerousPatterns = [
    { pattern: /<script\b[^>]*src\s*=/i, reason: "External script source detected" },
    { pattern: /\bfetch\s*\(/i, reason: "fetch() call detected" },
    { pattern: /\bXMLHttpRequest\b/i, reason: "XMLHttpRequest detected" },
    { pattern: /\beval\s*\(/i, reason: "eval() detected" },
    { pattern: /\bnew\s+Function\s*\(/i, reason: "new Function() detected" },
    { pattern: /\bdocument\.cookie\b/i, reason: "document.cookie access detected" },
    { pattern: /\blocalStorage\b/i, reason: "localStorage access detected" },
    { pattern: /\bsessionStorage\b/i, reason: "sessionStorage access detected" },
    { pattern: /javascript\s*:/i, reason: "javascript: URI detected" },
    { pattern: /data\s*:\s*text\/html/i, reason: "data:text/html URI detected" },
  ];

  for (const { pattern, reason } of dangerousPatterns) {
    if (pattern.test(html)) {
      errors.push(reason);
    }
  }

  // 4. Check for external framework imports (should be self-contained)
  const frameworkPatterns = [
    { pattern: /cdn\.jsdelivr\.net/i, reason: "External CDN dependency detected" },
    { pattern: /unpkg\.com/i, reason: "External CDN dependency detected" },
    { pattern: /cdnjs\.cloudflare\.com/i, reason: "External CDN dependency detected" },
  ];

  for (const { pattern, reason } of frameworkPatterns) {
    if (pattern.test(html)) {
      // Warn but don't block — Google Fonts is okay
      logger.warn("External resource detected in generated HTML", { reason });
    }
  }

  // 5. Size check — a single-page site shouldn't be enormous
  if (html.length > 500_000) {
    errors.push(`HTML too large: ${html.length} characters`);
  }

  if (html.length < 1_000) {
    errors.push(`HTML suspiciously small: ${html.length} characters`);
  }

  // 6. Must have a <title>
  if (!html.includes("<title>") || !html.includes("</title>")) {
    errors.push("Missing <title> tag");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Validate Static File Map ───────────────────────────

export function validateStaticFileMap(files: Map<string, string>): ValidationResult {
  const errors: string[] = [];

  if (!files.has("index.html")) {
    errors.push("Missing index.html");
  }

  const indexHtml = files.get("index.html");
  if (indexHtml) {
    const htmlValidation = validateGeneratedHtml(indexHtml);
    errors.push(...htmlValidation.errors);
  }

  // Check for unreasonable file sizes
  for (const [path, content] of files) {
    if (content.length > 500_000) {
      errors.push(`File too large: ${path} (${content.length} chars)`);
    }
  }

  return { valid: errors.length === 0, errors };
}
