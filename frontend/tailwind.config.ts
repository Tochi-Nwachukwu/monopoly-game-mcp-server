import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monopoly color scheme
        monopoly: {
          brown: "#8B4513",
          lightBlue: "#87CEEB",
          pink: "#FF69B4",
          orange: "#FFA500",
          red: "#FF0000",
          yellow: "#FFD700",
          green: "#228B22",
          darkBlue: "#00008B",
          railroad: "#1a1a1a",
          utility: "#808080",
        },
        board: {
          bg: "#C8E4BC",
          border: "#1a472a",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Oswald", "sans-serif"],
        body: ["Libre Franklin", "sans-serif"],
      },
      animation: {
        "dice-roll": "diceRoll 0.5s ease-in-out",
        "player-move": "playerMove 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 1s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        diceRoll: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(90deg)" },
          "50%": { transform: "rotate(180deg)" },
          "75%": { transform: "rotate(270deg)" },
        },
        playerMove: {
          "0%": { transform: "scale(1.2)", opacity: "0.5" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(16, 185, 129, 0.2), 0 0 10px rgba(16, 185, 129, 0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

