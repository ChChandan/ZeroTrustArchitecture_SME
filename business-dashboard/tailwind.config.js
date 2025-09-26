/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1e40af"
        },
        accent: "#0ea5e9",
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827"
        },
        success: "#22c55e",
        warning: "#facc15",
        info: "#38bdf8",
        pending: "#64748b"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(16,30,54,0.10), 0 1.5px 4px 0 rgba(16,30,54,0.06)"
      },
      transitionProperty: {
        width: 'width'
      }
    }
  },
  plugins: []
};