/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#FAFAFA",
        primary: { DEFAULT: "#D4AF37", foreground: "#000000" },
        card: { DEFAULT: "#0A0A0A", foreground: "#FAFAFA" },
        muted: { DEFAULT: "#1A1A1A", foreground: "#A1A1AA" },
        border: "#27272A",
        success: { DEFAULT: "#22C55E", foreground: "#FFFFFF" },
      },
    },
  },
  plugins: [],
};
