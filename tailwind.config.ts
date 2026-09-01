import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05080D",
        charcoal: "#0D1522",
        panel: "#101D2E",
        burgundy: "#123252",
        "burgundy-deep": "#081B2E",
        crimson: "#3AA9D6",
        royal: "#17244A",
        gold: "#AEDCEA",
        "gold-dim": "#6E93A6",
        bone: "#EAF3F7",
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
          "radial-gradient(circle at center, rgba(174,220,234,0.16) 0%, rgba(174,220,234,0) 70%)",
        "burgundy-wash":
          "linear-gradient(180deg, rgba(18,50,82,0.35) 0%, rgba(5,8,13,0) 100%)",
        "burgundy-vignette":
          "radial-gradient(120% 80% at 50% 0%, rgba(18,50,82,0.55) 0%, rgba(5,8,13,0) 60%)",
        "grain":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        "glass-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)",
      },
      boxShadow: {
        // Resting "embossed medallion" depth — a card sitting on the page,
        // not just a flat bordered box. Inner lines fake a beveled edge;
        // the outer shadow is the object's cast shadow on the void.
        "depth-sm":
          "inset 0 1px 0 0 rgba(255,255,255,0.04), inset 0 -1px 0 0 rgba(0,0,0,0.4), 0 12px 24px -14px rgba(0,0,0,0.65)",
        // Elevated hover state — lifts further off the page and picks up
        // a soft gold rim-glow, like catching light as it tilts.
        "depth-lg":
          "inset 0 1px 0 0 rgba(255,255,255,0.07), inset 0 -1px 0 0 rgba(0,0,0,0.5), 0 28px 52px -18px rgba(0,0,0,0.75), 0 0 44px -10px rgba(174,220,234,0.4)",
        // Frosted glass surfaces (nav, dropdowns, drawers) — a thin top
        // highlight plus soft ambient shadow instead of a hard border.
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -8px rgba(0,0,0,0.55)",
        // Tactile, pressable gold buttons.
        "btn-3d":
          "inset 0 1px 0 0 rgba(255,255,255,0.35), inset 0 -2px 0 0 rgba(0,0,0,0.22), 0 10px 22px -8px rgba(174,220,234,0.45)",
        "btn-3d-active":
          "inset 0 1px 3px 0 rgba(0,0,0,0.3), 0 2px 8px -3px rgba(174,220,234,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
