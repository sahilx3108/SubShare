import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f0",
          100: "#ffd6d6",
          400: "#ff6b6b",
          500: "#e50914",
          600: "#cc0812",
          700: "#a30610",
        },
        accent: {
          red:    "#e50914",
          orange: "#ff6b35",
        },
        surface: {
          DEFAULT: "#111111",
          2:       "#1a1a1a",
          3:       "#222222",
        },
        page: "#0a0a0a",
        subtle: "rgba(255,255,255,0.07)",
      },
      backgroundImage: {
        "gradient-brand":  "linear-gradient(135deg, #e50914 0%, #ff6b35 100%)",
        "gradient-brand-v":"linear-gradient(180deg, #e50914 0%, #ff6b35 100%)",
      },
      boxShadow: {
        card:      "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)",
        "card-dark":"0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.6)",
        "glow-red": "0 0 20px rgba(229,9,20,0.25), 0 0 0 1px rgba(229,9,20,0.15)",
        "glow-sm":  "0 0 12px rgba(229,9,20,0.20)",
        "glow-green":"0 0 12px rgba(34,197,94,0.30)",
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.08)",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(229,9,20,0.3)" },
          "50%":      { boxShadow: "0 0 20px rgba(229,9,20,0.7)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-in-up":  "fadeInUp 0.5s ease-out both",
        "fade-in-up-1":"fadeInUp 0.5s 0.1s ease-out both",
        "fade-in-up-2":"fadeInUp 0.5s 0.2s ease-out both",
        "fade-in-up-3":"fadeInUp 0.5s 0.3s ease-out both",
        shimmer:       "shimmer 2s linear infinite",
        "pulse-glow":  "pulseGlow 2s ease-in-out infinite",
        float:         "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
