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
          DEFAULT: "#090D0C",
          surface: "#111714",
          border: "#1F2923",
        },
        ink: {
          strong: "#111827",
          body: "#374151",
          muted: "#6B7280",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8FAF9",
          highlight: "#F1F5F3",
        },
        line: "#E5E7EB",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
        bezel: "2rem",
        "bezel-inner": "calc(2rem - 0.375rem)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        haptic: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.05), 0 8px 24px rgba(17,24,39,0.04)",
        glass: "0 8px 32px rgba(16,185,129,0.12)",
        "double-bezel": "0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.06)",
        "glow-emerald": "0 0 45px -10px rgba(16, 185, 129, 0.30)",
        "inner-specular": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "soft-radial":
          "radial-gradient(1200px 600px at 80% -10%, rgba(52,211,153,0.16), transparent 60%)",
        "mesh-hero":
          "radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.12) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(5, 150, 105, 0.08) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
