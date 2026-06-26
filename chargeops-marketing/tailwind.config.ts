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
        },
        ink: {
          strong: "#111827",
          body: "#374151",
          muted: "#6B7280",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F9FAFB",
        },
        line: "#E5E7EB",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.05), 0 8px 24px rgba(17,24,39,0.04)",
        glass: "0 8px 32px rgba(16,185,129,0.10)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "soft-radial":
          "radial-gradient(1200px 600px at 80% -10%, rgba(52,211,153,0.18), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
