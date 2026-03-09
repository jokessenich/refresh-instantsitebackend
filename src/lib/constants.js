export const COLORS = {
  bg: "#09090b",
  surface: "#111114",
  surfaceHover: "#18181b",
  border: "#27272a",
  borderSubtle: "#1e1e22",
  text: "#fafafa",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  accent: "#818cf8",
  accentHover: "#6366f1",
  accentDim: "rgba(129,140,248,0.12)",
  accentGlow: "rgba(129,140,248,0.06)",
  success: "#34d399",
  successDim: "rgba(52,211,153,0.12)",
};

export const SITE_CONFIG = {
  name: "InstantSite",
  price: "$499",
  previewDomain: "preview.instantsite.com",
  dnsRecords: [
    { type: "A", name: "@", value: "76.76.21.21" },
    { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
  ],
};

export const EXAMPLE_SITES = [
  { name: "Bloom Studio", type: "Photography", gradient: "linear-gradient(135deg, #831843, #be185d)" },
  { name: "Atlas Consulting", type: "Professional Services", gradient: "linear-gradient(135deg, #1e3a5f, #2563eb)" },
  { name: "Verde Kitchen", type: "Restaurant", gradient: "linear-gradient(135deg, #064e3b, #059669)" },
  { name: "Pulse Fitness", type: "Gym & Wellness", gradient: "linear-gradient(135deg, #7c2d12, #ea580c)" },
  { name: "Solace Therapy", type: "Health & Wellness", gradient: "linear-gradient(135deg, #4c1d95, #7c3aed)" },
  { name: "Flux Creative", type: "Design Agency", gradient: "linear-gradient(135deg, #78350f, #d97706)" },
];

export const COLOR_PALETTES = [
  { name: "Ocean", colors: ["#0ea5e9", "#06b6d4", "#0d1b2a"] },
  { name: "Forest", colors: ["#22c55e", "#16a34a", "#0f1f0f"] },
  { name: "Sunset", colors: ["#f97316", "#ef4444", "#1a0a0a"] },
  { name: "Lavender", colors: ["#a78bfa", "#818cf8", "#0f0a1f"] },
  { name: "Monochrome", colors: ["#fafafa", "#71717a", "#09090b"] },
];

export const FAQS = [
  {
    q: "Is the generated site editable?",
    a: "Yes. You receive the full source code of your website, which can be edited using any code editor or CMS. We also offer revision services if you need changes made.",
  },
  {
    q: "Can I connect my own domain?",
    a: "Absolutely. We provide step-by-step DNS configuration instructions. Simply point your domain's A record and CNAME to our servers and your site goes live.",
  },
  {
    q: "What if I want changes after generation?",
    a: "You can edit the code yourself, or reach out to us for revisions. Minor changes are included within 7 days of generation at no extra cost.",
  },
  {
    q: "How long does generation take?",
    a: "Most websites are generated within 2–3 minutes. Complex sites with many pages may take slightly longer.",
  },
  {
    q: "What technology are the sites built with?",
    a: "Generated sites use modern HTML, CSS, and JavaScript. They're static, fast-loading, and optimized for performance and SEO.",
  },
];

export const PRICING_FEATURES = [
  "AI-powered website generation",
  "Professional copywriting",
  "Responsive mobile design",
  "Hosting-ready deployment",
  "Domain connection instructions",
  "SEO-optimized structure",
];
