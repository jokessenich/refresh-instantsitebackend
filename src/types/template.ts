// src/types/template.ts

import type { BusinessType } from "./site-request";
import type { ThemeTokens } from "./generated-content";

/** Which sections a vertical includes and in what order */
export interface VerticalTemplate {
  id: string;
  name: string;
  businessType: BusinessType;
  defaultSections: readonly string[];
  defaultTheme: ThemeTokens;
  /** Allowed Google Fonts for this vertical */
  allowedFonts: readonly string[];
  /** Prompt hints specific to this vertical */
  promptHints: string;
}

/** Map of file path → file content (string for text, Buffer for binary) */
export type DeployableFileMap = Map<string, string | Buffer>;

/** Configuration passed to the file assembler */
export interface AssemblyContext {
  template: VerticalTemplate;
  content: import("./generated-content").GeneratedContent;
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  logoUrl?: string;
  imageUrls: string[];
}
