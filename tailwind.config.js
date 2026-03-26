/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#111114",
        "surface-hover": "#18181b",
        border: "#27272a",
        "border-subtle": "#1e1e22",
        "text-primary": "#fafafa",
        "text-muted": "#a1a1aa",
        "text-dim": "#71717a",
        accent: "#818cf8",
        "accent-hover": "#6366f1",
        "accent-dim": "rgba(129,140,248,0.12)",
        "accent-glow": "rgba(129,140,248,0.06)",
        success: "#34d399",
        "success-dim": "rgba(52,211,153,0.12)",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-in-right": "slideInRight 0.3s ease forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-ring": "pulseRing 2s ease-in-out infinite",
        "progress-pulse": "progressPulse 1s ease-in-out infinite",
        "spin-slow": "spin 1s linear infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "grid-fade": "gridFade 8s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "50%": { transform: "scale(1.1)", opacity: "0.2" },
          "100%": { transform: "scale(0.8)", opacity: "0.6" },
        },
        progressPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gridFade: {
          "0%": { opacity: "0.03" },
          "50%": { opacity: "0.06" },
          "100%": { opacity: "0.03" },
        },
      },
    },
  },
  plugins: [],
};
