import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: "#ff6b00",
        temple: "#7b241c",
        marigold: "#f6c453",
        ink: "#201814",
      },
    },
  },
  plugins: [],
};

export default config;
