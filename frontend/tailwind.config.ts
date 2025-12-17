import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: "#1a1a1a",       // Deep matte background
          surface: "#212121",  // Sidebar/Card background
          input: "#2f2f2f",    // Input fields
          text: "#ececec",     // High contrast text
          subtext: "#b4b4b4",  // Low contrast text
          accent: "#d97757",   // The specific "Claude Orange"
          border: "#333333",
        },
        jwt: {
          header: "#e46f6f",   // Soft Red
          payload: "#b084cc",  // Soft Purple
          signature: "#5fb0b0" // Soft Teal
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'], 
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;