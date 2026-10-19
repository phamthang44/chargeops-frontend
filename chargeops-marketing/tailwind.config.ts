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
          soft: "#D1FAE5",
          neon: "#00E599",
        },
        obsidian: {
          DEFAULT: "#080C0A",
          surface: "#0F1512",
          card: "#121A16",
          border: "#1C2721",
        },
        ink: {
          strong: "#0A0D0C",
          heading: "#111827",
          body: "#374151",
          muted: "#6B7280",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8FAF9",
          muted: "#F0F4F2",
          highlight: "#E6EFEB",
        },
        line: {
          DEFAULT: "#E5E7EB",
          subtle: "#F0F2F1",
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
      transitionTimingFunction: {
        haptic: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        kinetic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.05), 0 8px 24px rgba(17,24,39,0.04)",
        glass: "0 8px 32px rgba(16,185,129,0.12)",
        diffusion: "0 24px 48px -18px rgba(0, 0, 0, 0.06)",
        "diffusion-dark": "0 24px 60px -15px rgba(0, 0, 0, 0.7)",
        "double-bezel": "0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.06)",
        "glow-emerald": "0 0 45px -10px rgba(16, 185, 129, 0.35)",
        "glow-laser": "0 0 20px 2px rgba(0, 229, 153, 0.6)",
        "inner-specular": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)",
        "inner-specular-dark": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "soft-radial":
          "radial-gradient(1200px 600px at 80% -10%, rgba(52,211,153,0.16), transparent 60%)",
        "mesh-hero":
          "radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(5, 150, 105, 0.10) 0px, transparent 50%)",
        "mesh-dark":
          "radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.18) 0px, transparent 65%), radial-gradient(at 100% 100%, rgba(0, 229, 153, 0.08) 0px, transparent 50%)",
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
