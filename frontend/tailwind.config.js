/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        heal: {
          bg: "#f0f4f9",
          mint: "#ecfdf5",
          leaf: "#22c55e",
          leafDark: "#16a34a",
        },
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 8px 16px -8px rgba(15, 23, 42, 0.06)",
        "card-sm": "0 2px 12px -2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

