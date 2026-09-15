import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        border: "var(--border)",
        muted: "var(--muted)",
        stoun: {
          violet: "#8B5CF6",
          "violet-dark": "#6D28D9",
          coral: "#FF6B5B",
          gold: "#F5B942",
          ink: "#0A0A0F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(139, 92, 246, 0.55)",
        "glow-gold": "0 0 30px -6px rgba(245, 185, 66, 0.65)",
      },
      backgroundImage: {
        "stoun-gradient": "linear-gradient(135deg, #8B5CF6 0%, #FF6B5B 100%)",
        "stoun-radial": "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.25), transparent 60%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
