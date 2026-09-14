import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    ink: "#0f0f0f",
    mint: "#ffe5e5",
    cream: "#ffffff",
    emerald: {
      50: "#fff5f5", 100: "#ffe5e5", 200: "#fecaca", 300: "#fca5a5",
      400: "#f87171", 500: "#dc2626", 600: "#b00000", 700: "#8f0000",
      800: "#5f0000", 900: "#470000", 950: "#2d0000",
    },
  }, fontFamily: { sans: ["var(--font-geist)", "Arial", "sans-serif"] } } },
  plugins: []
};
export default config;
