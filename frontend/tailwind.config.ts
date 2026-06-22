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
        primary: {
          DEFAULT: "#00d2ff", // electric blue/cyan
          dark: "#0072ff",
        },
        navy: {
          light: "#1e293b",
          dark: "#0a0f1d",
          deep: "#030712",
        },
        accent: {
          purple: "#c084fc", // purple
          indigo: "#6366f1",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(30, 41, 59, 0.25) 100%)",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 210, 255, 0.08)",
        "glass-glow": "0 0 20px rgba(0, 210, 255, 0.15)",
        "purple-glow": "0 0 20px rgba(192, 132, 252, 0.15)",
      },
      backdropBlur: {
        "glass": "12px",
      }
    },
  },
  plugins: [],
};
export default config;
