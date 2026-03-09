// src/types/generated-content.ts

import { z } from "zod";

// ─── Theme Tokens ───────────────────────────────────────

export const ThemeTokensSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  headingFont: z.string().max(50),
  bodyFont: z.string().max(50),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

// ─── Section Content Types ──────────────────────────────

export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  headline: z.string().max(120),
  subheadline: z.string().max(250),
  ctaText: z.string().max(40),
  ctaUrl: z.string().default("#contact"),
});

export const ServiceItemSchema = z.object({
  title: z.string().max(80),
  description: z.string().max(300),
  icon: z.string().max(40).optional(), // Lucide icon name
});

export const ServicesSectionSchema = z.object({
  type: z.literal("services"),
  heading: z.string().max(100),
  subheading: z.string().max(200).optional(),
  items: z.array(ServiceItemSchema).min(1).max(12),
});

export const AboutSectionSchema = z.object({
  type: z.literal("about"),
  heading: z.string().max(100),
  paragraphs: z.array(z.string().max(600)).min(1).max(4),
  highlightStats: z
    .array(
      z.object({
        value: z.string().max(20),
        label: z.string().max(50),
      })
    )
    .max(4)
    .optional(),
});

export const TestimonialSchema = z.object({
  quote: z.string().max(400),
  author: z.string().max(80),
  role: z.string().max(80).optional(),
});

export const TestimonialsSectionSchema = z.object({
  type: z.literal("testimonials"),
  heading: z.string().max(100),
  items: z.array(TestimonialSchema).min(1).max(6),
});

export const ContactSectionSchema = z.object({
  type: z.literal("contact"),
  heading: z.string().max(100),
  subheading: z.string().max(200).optional(),
  formFields: z
    .array(z.enum(["name", "email", "phone", "message", "service"]))
    .default(["name", "email", "message"]),
});

export const FooterSectionSchema = z.object({
  type: z.literal("footer"),
  copyrightText: z.string().max(200),
  tagline: z.string().max(200).optional(),
});

// ─── Union of all section types ─────────────────────────

export const SiteSectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  ServicesSectionSchema,
  AboutSectionSchema,
  TestimonialsSectionSchema,
  ContactSectionSchema,
  FooterSectionSchema,
]);

export type SiteSection = z.infer<typeof SiteSectionSchema>;

// ─── Full Generated Content ─────────────────────────────

export const GeneratedContentSchema = z.object({
  siteTitle: z.string().max(100),
  siteDescription: z.string().max(200), // meta description
  theme: ThemeTokensSchema,
  sections: z
    .array(SiteSectionSchema)
    .min(3)
    .max(8)
    .refine(
      (sections) => sections.some((s) => s.type === "hero"),
      "Must include a hero section"
    )
    .refine(
      (sections) => sections.some((s) => s.type === "contact"),
      "Must include a contact section"
    ),
  navItems: z
    .array(
      z.object({
        label: z.string().max(30),
        href: z.string().max(50),
      })
    )
    .min(2)
    .max(6),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

// ─── Allowed Section Types ──────────────────────────────

export const ALLOWED_SECTION_TYPES = [
  "hero",
  "services",
  "about",
  "testimonials",
  "contact",
  "footer",
] as const;
