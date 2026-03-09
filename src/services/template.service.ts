// src/services/template.service.ts

import type { BusinessType } from "@/types/site-request";
import type { VerticalTemplate } from "@/types/template";
import type { ThemeTokens } from "@/types/generated-content";

// ─── Default Themes per Vertical ────────────────────────

const THEMES: Record<BusinessType, ThemeTokens> = {
  contractor: {
    primaryColor: "#1B3A4B",
    secondaryColor: "#F4A261",
    accentColor: "#E76F51",
    backgroundColor: "#FAFAF8",
    textColor: "#1A1A1A",
    headingFont: "DM Serif Display",
    bodyFont: "Source Sans 3",
  },
  restaurant: {
    primaryColor: "#2D1810",
    secondaryColor: "#C8553D",
    accentColor: "#D4A574",
    backgroundColor: "#FDF8F4",
    textColor: "#2D1810",
    headingFont: "Playfair Display",
    bodyFont: "Lato",
  },
  therapist: {
    primaryColor: "#3D5A5B",
    secondaryColor: "#A7C4BC",
    accentColor: "#DDA77B",
    backgroundColor: "#F7F5F2",
    textColor: "#2C3E3E",
    headingFont: "Cormorant Garamond",
    bodyFont: "Nunito Sans",
  },
  consultant: {
    primaryColor: "#0F1729",
    secondaryColor: "#3B5BDB",
    accentColor: "#4ECDC4",
    backgroundColor: "#FFFFFF",
    textColor: "#1A1A2E",
    headingFont: "Sora",
    bodyFont: "IBM Plex Sans",
  },
  photographer: {
    primaryColor: "#1A1A1A",
    secondaryColor: "#E8E4DF",
    accentColor: "#C8A96E",
    backgroundColor: "#FFFFFF",
    textColor: "#333333",
    headingFont: "Libre Baskerville",
    bodyFont: "Karla",
  },
  "local-service": {
    primaryColor: "#1E3A5F",
    secondaryColor: "#4A90D9",
    accentColor: "#FF8C42",
    backgroundColor: "#F5F7FA",
    textColor: "#2C3E50",
    headingFont: "Outfit",
    bodyFont: "Open Sans",
  },
};

// ─── Vertical Templates ─────────────────────────────────

const VERTICAL_TEMPLATES: Record<BusinessType, VerticalTemplate> = {
  contractor: {
    id: "contractor-v1",
    name: "Contractor",
    businessType: "contractor",
    defaultSections: ["hero", "services", "about", "testimonials", "contact", "footer"],
    defaultTheme: THEMES.contractor,
    allowedFonts: ["DM Serif Display", "Source Sans 3", "Oswald", "Roboto"],
    promptHints:
      "Focus on trust, reliability, and local expertise. Emphasize licensed/insured status, project types, and service areas. Use action-oriented CTA language like 'Get a Free Estimate'.",
  },
  restaurant: {
    id: "restaurant-v1",
    name: "Restaurant",
    businessType: "restaurant",
    defaultSections: ["hero", "about", "services", "testimonials", "contact", "footer"],
    defaultTheme: THEMES.restaurant,
    allowedFonts: ["Playfair Display", "Lato", "Cormorant Garamond", "Poppins"],
    promptHints:
      "Focus on ambiance, cuisine style, and dining experience. Services = menu categories. CTA should be 'View Our Menu' or 'Make a Reservation'. Use warm, inviting language.",
  },
  therapist: {
    id: "therapist-v1",
    name: "Therapist / Counselor",
    businessType: "therapist",
    defaultSections: ["hero", "about", "services", "testimonials", "contact", "footer"],
    defaultTheme: THEMES.therapist,
    allowedFonts: ["Cormorant Garamond", "Nunito Sans", "Lora", "Mulish"],
    promptHints:
      "Focus on empathy, safety, and the therapeutic journey. Use warm, non-clinical language. CTA like 'Schedule a Consultation'. Services = specialties or approaches.",
  },
  consultant: {
    id: "consultant-v1",
    name: "Consultant",
    businessType: "consultant",
    defaultSections: ["hero", "services", "about", "testimonials", "contact", "footer"],
    defaultTheme: THEMES.consultant,
    allowedFonts: ["Sora", "IBM Plex Sans", "Manrope", "Inter"],
    promptHints:
      "Focus on expertise, results, and measurable impact. Use professional but confident language. CTA like 'Book a Strategy Call'. Include outcome-oriented descriptions.",
  },
  photographer: {
    id: "photographer-v1",
    name: "Photographer",
    businessType: "photographer",
    defaultSections: ["hero", "services", "about", "testimonials", "contact", "footer"],
    defaultTheme: THEMES.photographer,
    allowedFonts: ["Libre Baskerville", "Karla", "Cormorant", "Josefin Sans"],
    promptHints:
      "Focus on visual storytelling and artistic vision. Use evocative, minimal language. CTA like 'View Portfolio' or 'Book a Session'. Services = photography types.",
  },
  "local-service": {
    id: "local-service-v1",
    name: "Local Service Business",
    businessType: "local-service",
    defaultSections: ["hero", "services", "about", "testimonials", "contact", "footer"],
    defaultTheme: THEMES["local-service"],
    allowedFonts: ["Outfit", "Open Sans", "Rubik", "Work Sans"],
    promptHints:
      "Focus on convenience, local reputation, and fast response. Use friendly, approachable language. CTA like 'Call Now' or 'Get a Quote'. Emphasize service area.",
  },
};

// ─── Public API ─────────────────────────────────────────

export function getTemplate(businessType: BusinessType): VerticalTemplate {
  const template = VERTICAL_TEMPLATES[businessType];
  if (!template) {
    throw new Error(`No template found for business type: ${businessType}`);
  }
  return template;
}

export function getAllTemplates(): VerticalTemplate[] {
  return Object.values(VERTICAL_TEMPLATES);
}

/** Merge user color/font preferences with template defaults */
export function resolveTheme(
  template: VerticalTemplate,
  colorPreference?: string,
  fontPreference?: string
): { themeHints: string } {
  // We pass hints to Claude so it can adjust within bounds.
  // The actual theme tokens come back in Claude's response and are validated.
  const hints: string[] = [];

  if (colorPreference) {
    hints.push(`User prefers these colors: ${colorPreference}. Adapt the palette to match while keeping contrast accessible.`);
  }
  if (fontPreference) {
    const allowed = template.allowedFonts.join(", ");
    hints.push(`User prefers: ${fontPreference}. Choose from allowed fonts: ${allowed}.`);
  }

  return { themeHints: hints.join(" ") };
}
