import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    ink: "#0f0f0f",
    mint: "#ffe5e5",
    cream: "#fffafa",
    emerald: {
      50: "#fff5f5", 100: "#ffe5e5", 200: "#fecaca", 300: "#fca5a5",
      400: "#f87171", 500: "#ef4444", 600: "#ff0000", 700: "#dc0000",
      800: "#b00000", 900: "#8f0000", 950: "#5f0000",
    },
  }, fontFamily: { sans: ["var(--font-geist)", "Arial", "sans-serif"] } } },
  plugins: []
};
export default config;
