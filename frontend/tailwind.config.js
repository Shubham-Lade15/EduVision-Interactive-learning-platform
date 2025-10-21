// tailwind.config.js
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          400: "#06b6d4",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        neutral: {
          50: "#fafafa",
          100: "#f4f4f5",
          700: "#3f3f46",
          900: "#18181b",
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.neutral.700"),
            h1: {
              fontFamily: theme("fontFamily.display").join(","),
              fontWeight: "800",
              letterSpacing: "-0.02em",
              color: theme("colors.brand.600"),
            },
            h2: {
              fontFamily: theme("fontFamily.display").join(","),
              fontWeight: "700",
              color: theme("colors.brand.600"),
            },
            a: {
              color: theme("colors.accent.500"),
              "&:hover": { color: theme("colors.accent.600") },
            },
          },
        },
        invert: {
          css: {
            color: theme("colors.neutral.50"),
            h1: { color: theme("colors.brand.400") },
            h2: { color: theme("colors.brand.400") },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
