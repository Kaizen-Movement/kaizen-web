import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050507",
        charcoal: "#111116",
        panel: "#17191F",
        burgundy: "#5A367C",
        "burgundy-deep": "#0D0F14",
        crimson: "#C21F3A",
        royal: "#244E86",
        gold: "#D5D6DC",
        "gold-dim": "#8E919B",
        bone: "#F2F2F4",
        lavender: "#A780E8",
        "platinum-bright": "#F7F7F8",
        chrome: "#8E919B",
        mastery: "#70A9E4",
        lifestyle: "#B26DE2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        impact: ["var(--font-anton)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      backgroundImage: {
        "seal-radial":
          "radial-gradient(circle at center, rgba(167,128,232,0.16) 0%, rgba(167,128,232,0) 70%)",
        "burgundy-wash":
          "linear-gradient(180deg, rgba(90,54,124,0.22) 0%, rgba(5,5,7,0) 100%)",
        "burgundy-vignette":
          "radial-gradient(120% 80% at 50% 0%, rgba(90,54,124,0.38) 0%, rgba(5,5,7,0) 60%)",
        "grain":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        "glass-sheen":
          "linear-gradient(135deg, rgba(247,247,248,0.07) 0%, rgba(247,247,248,0) 40%)",
        "satin-platinum":
          "linear-gradient(115deg, rgba(247,247,248,0.12) 0%, rgba(213,214,220,0.02) 28%, rgba(247,247,248,0.08) 52%, rgba(142,145,155,0.02) 76%, rgba(247,247,248,0.08) 100%)",
      },
      boxShadow: {
        "depth-sm":
          "inset 0 1px 0 0 rgba(255,255,255,0.04), inset 0 -1px 0 0 rgba(0,0,0,0.42), 0 12px 32px rgba(0,0,0,0.42)",
        "depth-lg":
          "inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 0 rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.58), 0 0 24px rgba(167,128,232,0.18)",
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.42)",
        "btn-3d":
          "inset 0 1px 0 0 rgba(255,255,255,0.42), inset 0 -2px 0 0 rgba(0,0,0,0.22), 0 12px 32px -10px rgba(213,214,220,0.35)",
        "btn-3d-active":
          "inset 0 1px 3px 0 rgba(0,0,0,0.3), 0 2px 8px -3px rgba(213,214,220,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
