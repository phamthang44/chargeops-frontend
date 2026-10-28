import type { Config } from "tailwindcss";

/**
 * Tailwind theme mirrors ../DESIGN_SYSTEM.md (the platform source of truth).
 * Keep these values in sync with the driver app's src/theme/colors.ts.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#34D399",
          soft: "rgba(16, 185, 129, 0.15)",
          neon: "#00E599",
          electric: "#00F2FE",
        },
        obsidian: {
          DEFAULT: "#070A08",
          surface: "#0B100D",
          card: "#0E1512",
          border: "rgba(255, 255, 255, 0.10)",
        },
        ink: {
          strong: "#FFFFFF",
          heading: "#F8FAFC",
          body: "#94A3B8",
          muted: "#64748B",
        },
        surface: {
          DEFAULT: "#0E1512",
          alt: "#121A16",
          muted: "#17231E",
          highlight: "#1F2E27",
        },
        line: {
          DEFAULT: "rgba(255, 255, 255, 0.10)",
          subtle: "rgba(255, 255, 255, 0.05)",
          dark: "rgba(255, 255, 255, 0.08)",
        },
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
        bezel: "2rem",
        "bezel-inner": "calc(2rem - 0.375rem)",
        "bezel-lg": "2.5rem",
        "bezel-lg-inner": "calc(2.5rem - 0.5rem)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        "3xl": ["1.875rem", { lineHeight: "2.35rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.85rem" }],
        "5xl": ["3rem", { lineHeight: "3.75rem" }],
        "6xl": ["3.75rem", { lineHeight: "4.65rem" }],
      },
      letterSpacing: {
        tight: "-0.015em",
        tighter: "-0.03em",
      },
      transitionTimingFunction: {
        haptic: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        kinetic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.6)",
        diffusion: "0 24px 60px -15px rgba(0, 0, 0, 0.8)",
        "diffusion-dark": "0 24px 60px -15px rgba(0, 0, 0, 0.9)",
        "double-bezel": "0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.8)",
        "glow-emerald": "0 0 45px -10px rgba(16, 185, 129, 0.35)",
        "glow-laser": "0 0 20px 2px rgba(0, 229, 153, 0.6)",
        "glow-electric": "0 0 35px -5px rgba(0, 242, 254, 0.35)",
        "inner-specular": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
        "inner-specular-dark": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #00F2FE 0%, #10B981 50%, #00E599 100%)",
        "soft-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,0.14), rgba(0,242,254,0.05), transparent 70%)",
        "mesh-hero":
          "radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.16) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(0, 242, 254, 0.06) 0px, transparent 50%)",
        "mesh-dark":
          "radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.18) 0px, transparent 65%), radial-gradient(at 100% 100%, rgba(0, 242, 254, 0.08) 0px, transparent 50%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "laser-sweep": {
          "0%": { transform: "translateY(0%)", opacity: "0.2" },
          "50%": { transform: "translateY(100%)", opacity: "0.9" },
          "100%": { transform: "translateY(0%)", opacity: "0.2" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "laser-sweep": "laser-sweep 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
