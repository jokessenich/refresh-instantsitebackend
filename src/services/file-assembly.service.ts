// src/services/file-assembly.service.ts

import type { AssemblyContext, DeployableFileMap } from "@/types/template";
import type {
  GeneratedContent,
  SiteSection,
  HeroSectionSchema,
  ServicesSectionSchema,
  AboutSectionSchema,
  TestimonialsSectionSchema,
  ContactSectionSchema,
  FooterSectionSchema,
} from "@/types/generated-content";
import { z } from "zod";

// ─── Public API ─────────────────────────────────────────

export function assembleDeployableFiles(ctx: AssemblyContext): DeployableFileMap {
  const files: DeployableFileMap = new Map();

  // Core Next.js files
  files.set("package.json", generatePackageJson(ctx));
  files.set("tsconfig.json", generateTsConfig());
  files.set("next.config.js", generateNextConfig());
  files.set("next-env.d.ts", NEXT_ENV_DTS);
  files.set("vercel.json", generateVercelJson());
  files.set("tailwind.config.ts", generateTailwindConfig(ctx.content.theme));
  files.set("postcss.config.js", POSTCSS_CONFIG);

  // App files
  files.set("app/layout.tsx", generateLayout(ctx));
  files.set("app/page.tsx", generatePage(ctx));
  files.set("app/globals.css", generateGlobalsCss(ctx.content.theme));

  return files;
}

// ─── package.json ───────────────────────────────────────

function generatePackageJson(ctx: AssemblyContext): string {
  const pkg = {
    name: slugify(ctx.businessName),
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "14.2.15",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^0.453.0",
    },
    devDependencies: {
      typescript: "^5.6.3",
      "@types/node": "^22.8.1",
      "@types/react": "^18.3.11",
      "@types/react-dom": "^18.3.1",
      tailwindcss: "^3.4.14",
      postcss: "^8.4.47",
      autoprefixer: "^10.4.20",
    },
  };
  return JSON.stringify(pkg, null, 2);
}

// ─── tsconfig.json ──────────────────────────────────────

function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"],
  };
  return JSON.stringify(config, null, 2);
}

// ─── next.config.js ─────────────────────────────────────

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
`;
}

const NEXT_ENV_DTS = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;

function generateVercelJson(): string {
  return JSON.stringify(
    {
      framework: "nextjs",
      buildCommand: "next build",
      outputDirectory: ".next",
    },
    null,
    2
  );
}

// ─── Tailwind ───────────────────────────────────────────

function generateTailwindConfig(
  theme: GeneratedContent["theme"]
): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "${theme.primaryColor}",
        secondary: "${theme.secondaryColor}",
        accent: "${theme.accentColor}",
        background: "${theme.backgroundColor}",
        foreground: "${theme.textColor}",
      },
      fontFamily: {
        heading: ['"${theme.headingFont}"', "serif"],
        body: ['"${theme.bodyFont}"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
`;
}

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

// ─── globals.css ────────────────────────────────────────

function generateGlobalsCss(theme: GeneratedContent["theme"]): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=${encodeFont(theme.headingFont)}:wght@400;600;700&family=${encodeFont(theme.bodyFont)}:wght@300;400;500;600&display=swap');

:root {
  --color-primary: ${theme.primaryColor};
  --color-secondary: ${theme.secondaryColor};
  --color-accent: ${theme.accentColor};
  --color-bg: ${theme.backgroundColor};
  --color-text: ${theme.textColor};
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "${theme.bodyFont}", sans-serif;
  color: ${theme.textColor};
  background-color: ${theme.backgroundColor};
}
`;
}

// ─── layout.tsx ─────────────────────────────────────────

function generateLayout(ctx: AssemblyContext): string {
  const { content } = ctx;
  return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(content.siteTitle)},
  description: ${JSON.stringify(content.siteDescription)},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

// ─── page.tsx (main page with all sections) ─────────────

function generatePage(ctx: AssemblyContext): string {
  const { content, businessName, contactEmail, contactPhone } = ctx;

  const navItemsStr = content.navItems
    .map((n) => `  { label: ${JSON.stringify(n.label)}, href: ${JSON.stringify(n.href)} }`)
    .join(",\n");

  const sectionComponents = content.sections
    .map((section) => renderSectionComponent(section, ctx))
    .join("\n\n");

  const sectionJsx = content.sections
    .map((section) => `      <${componentName(section.type)}Section />`)
    .join("\n");

  return `"use client";

import { Phone, Mail, MapPin, Menu, X, ${collectIcons(content)} } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
${navItemsStr}
];

// ─── Navigation ──────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-primary/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#" className="font-heading text-xl font-bold text-primary">
            ${escapeJsx(businessName)}
          </a>
          <div className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {item.label}
              </a>
            ))}
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-primary/10 bg-background px-4 py-4 space-y-3">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="block text-sm font-medium text-foreground/70 hover:text-primary">
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Section Components ──────────────────────────────

${sectionComponents}

// ─── Page ────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16">
${sectionJsx}
      </div>
    </main>
  );
}
`;
}

// ─── Section Renderers ──────────────────────────────────

function renderSectionComponent(section: SiteSection, ctx: AssemblyContext): string {
  switch (section.type) {
    case "hero":
      return renderHero(section);
    case "services":
      return renderServices(section);
    case "about":
      return renderAbout(section);
    case "testimonials":
      return renderTestimonials(section);
    case "contact":
      return renderContact(section, ctx);
    case "footer":
      return renderFooter(section, ctx);
    default:
      return "";
  }
}

function renderHero(s: z.infer<typeof import("@/types/generated-content").HeroSectionSchema>): string {
  return `function HeroSection() {
  return (
    <section id="hero" className="relative py-24 sm:py-32 lg:py-40 bg-primary text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          ${escapeJsx(s.headline)}
        </h1>
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
          ${escapeJsx(s.subheadline)}
        </p>
        <a href="${s.ctaUrl}"
          className="inline-block bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors">
          ${escapeJsx(s.ctaText)}
        </a>
      </div>
    </section>
  );
}`;
}

function renderServices(
  s: z.infer<typeof import("@/types/generated-content").ServicesSectionSchema>
): string {
  const itemsStr = s.items
    .map(
      (item) =>
        `    { title: ${JSON.stringify(item.title)}, description: ${JSON.stringify(item.description)} }`
    )
    .join(",\n");

  return `function ServicesSection() {
  const services = [
${itemsStr}
  ];

  return (
    <section id="services" className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
            ${escapeJsx(s.heading)}
          </h2>
          ${s.subheading ? `<p className="text-foreground/60 text-lg max-w-2xl mx-auto">${escapeJsx(s.subheading)}</p>` : ""}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-primary/5 hover:shadow-md transition-shadow">
              <h3 className="font-heading text-xl font-semibold text-primary mb-3">{svc.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{svc.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;
}

function renderAbout(
  s: z.infer<typeof import("@/types/generated-content").AboutSectionSchema>
): string {
  const paragraphsStr = s.paragraphs.map((p) => JSON.stringify(p)).join(",\n    ");
  const statsStr = s.highlightStats
    ? s.highlightStats
        .map((st) => `    { value: ${JSON.stringify(st.value)}, label: ${JSON.stringify(st.label)} }`)
        .join(",\n")
    : "";

  return `function AboutSection() {
  const paragraphs = [
    ${paragraphsStr}
  ];
  ${
    statsStr
      ? `const stats = [\n${statsStr}\n  ];`
      : ""
  }

  return (
    <section id="about" className="py-20 sm:py-28 bg-secondary/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-8 text-center">
          ${escapeJsx(s.heading)}
        </h2>
        <div className="space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-foreground/80 text-lg leading-relaxed">{p}</p>
          ))}
        </div>
        ${
          statsStr
            ? `<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-heading text-3xl font-bold text-accent">{stat.value}</div>
              <div className="text-foreground/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>`
            : ""
        }
      </div>
    </section>
  );
}`;
}

function renderTestimonials(
  s: z.infer<typeof import("@/types/generated-content").TestimonialsSectionSchema>
): string {
  const itemsStr = s.items
    .map(
      (t) =>
        `    { quote: ${JSON.stringify(t.quote)}, author: ${JSON.stringify(t.author)}, role: ${JSON.stringify(t.role ?? "")} }`
    )
    .join(",\n");

  return `function TestimonialsSection() {
  const testimonials = [
${itemsStr}
  ];

  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-16 text-center">
          ${escapeJsx(s.heading)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-primary/5">
              <p className="text-foreground/80 italic leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="font-semibold text-primary">{t.author}</div>
                {t.role && <div className="text-foreground/50 text-sm">{t.role}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;
}

function renderContact(
  s: z.infer<typeof import("@/types/generated-content").ContactSectionSchema>,
  ctx: AssemblyContext
): string {
  const fields = s.formFields;
  const fieldJsx = fields
    .map((f) => {
      if (f === "message") {
        return `          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground/70 mb-2">Message</label>
            <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none" placeholder="Tell us about your project..." />
          </div>`;
      }
      const label = f.charAt(0).toUpperCase() + f.slice(1);
      return `          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">${label}</label>
            <input type="${f === "email" ? "email" : f === "phone" ? "tel" : "text"}" className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:border-accent focus:ring-1 focus:ring-accent outline-none" placeholder="${label}" />
          </div>`;
    })
    .join("\n");

  return `function ContactSection() {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-secondary/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
            ${escapeJsx(s.heading)}
          </h2>
          ${s.subheading ? `<p className="text-foreground/60 text-lg">${escapeJsx(s.subheading)}</p>` : ""}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
${fieldJsx}
              <div className="md:col-span-2">
                <button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-4 rounded-lg transition-colors text-lg">
                  Send Message
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-accent mt-1 shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground/50 mb-1">Email</div>
                <a href="mailto:${ctx.contactEmail}" className="text-primary hover:text-accent transition-colors">
                  ${escapeJsx(ctx.contactEmail)}
                </a>
              </div>
            </div>
            ${
              ctx.contactPhone
                ? `<div className="flex items-start gap-3">
              <Phone size={20} className="text-accent mt-1 shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground/50 mb-1">Phone</div>
                <a href="tel:${ctx.contactPhone}" className="text-primary hover:text-accent transition-colors">
                  ${escapeJsx(ctx.contactPhone)}
                </a>
              </div>
            </div>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
  );
}`;
}

function renderFooter(
  s: z.infer<typeof import("@/types/generated-content").FooterSectionSchema>,
  ctx: AssemblyContext
): string {
  return `function FooterSection() {
  return (
    <footer className="bg-primary text-white/80 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-heading text-lg font-bold text-white">${escapeJsx(ctx.businessName)}</div>
          ${s.tagline ? `<p className="text-white/60 text-sm">${escapeJsx(s.tagline)}</p>` : ""}
          <p className="text-white/50 text-sm">${escapeJsx(s.copyrightText)}</p>
        </div>
      </div>
    </footer>
  );
}`;
}

// ─── Helpers ────────────────────────────────────────────

function componentName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeJsx(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;");
}

function encodeFont(fontName: string): string {
  return fontName.replace(/ /g, "+");
}

/** Collect unique Lucide icon names from services */
function collectIcons(content: GeneratedContent): string {
  const icons = new Set<string>();
  for (const section of content.sections) {
    if (section.type === "services") {
      for (const item of section.items) {
        if (item.icon) icons.add(item.icon);
      }
    }
  }
  // We import Phone, Mail, MapPin, Menu, X by default — only add others
  return [...icons].filter((i) => !["Phone", "Mail", "MapPin", "Menu", "X"].includes(i)).join(", ");
}
