import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/app/globals.css"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Nunito", "sans-serif"],
        display: ["var(--font-display)", "Baloo 2", "sans-serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        // Nếp's Garden palette — pastels are fills, deep tones carry text.
        rice: "#FDF5F1",
        mochi: "#FFFDFC",
        plum: "#4A3D46",
        mauve: "#6F6069",
        wafer: "#F5E6E0",
        matcha: {
          DEFAULT: "#7FB069",
          deep: "#4C7A43"
        },
        sakura: {
          DEFAULT: "#F6C6CE",
          deep: "#B14B66"
        },
        butter: "#FFD98E",
        honey: "#F2B04C",
        dawn: {
          DEFAULT: "#A9C6E8",
          deep: "#38678F"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 12px)"
      },
      boxShadow: {
        mochi: "0 2px 6px rgb(74 61 70 / 0.05), 0 10px 30px rgb(74 61 70 / 0.06)",
        "mochi-lift": "0 4px 10px rgb(74 61 70 / 0.07), 0 16px 40px rgb(74 61 70 / 0.10)",
        soft: "0 10px 26px rgb(74 61 70 / 0.08)",
        note: "0 2px 6px rgb(74 61 70 / 0.05), 0 10px 30px rgb(74 61 70 / 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
