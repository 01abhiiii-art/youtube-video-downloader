import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#10221f", mint: "#bdf6d7", cream: "#f7f8f2" }, fontFamily: { sans: ["var(--font-geist)", "Arial", "sans-serif"] } } },
  plugins: []
};
export default config;
