/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#1E1E22",
        "charcoal-soft": "#232328",
        ivory: "#F8F5F0",
        gold: "#C5A46D",
        "gold-soft": "#D7C5A0",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(0,0,0,0.08)",
        card: "0 18px 55px rgba(0,0,0,0.10)",
        glow: "0 0 0 1px rgba(197,164,109,0.25), 0 8px 26px rgba(197,164,109,0.25)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};


