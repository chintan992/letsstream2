/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: {
          DEFAULT: "240 3.7% 15.9%",
        },
        input: {
          DEFAULT: "240 3.7% 15.9%",
        },
        ring: {
          DEFAULT: "240 4.9% 83.9%",
        },
        background: {
          DEFAULT: "240 10% 3.9%",
        },
        foreground: {
          DEFAULT: "0 0% 98%",
        },
        primary: {
          DEFAULT: "0 0% 98%",
          foreground: "240 5.9% 10%",
        },
        secondary: {
          DEFAULT: "240 3.7% 15.9%",
          foreground: "0 0% 98%",
        },
        destructive: {
          DEFAULT: "0 62.8% 30.6%",
          foreground: "0 0% 98%",
        },
        muted: {
          DEFAULT: "240 3.7% 15.9%",
          foreground: "240 5% 64.9%",
        },
        accent: {
          DEFAULT: "347 80% 55%",
          foreground: "210 40% 98%",
        },
        popover: {
          DEFAULT: "240 10% 3.9%",
          foreground: "0 0% 98%",
        },
        card: {
          DEFAULT: "240 10% 3.9%",
          foreground: "0 0% 98%",
        },
        sidebar: {
          DEFAULT: "240 10% 3.9%",
          foreground: "0 0% 98%",
          primary: "0 0% 98%",
          "primary-foreground": "240 5.9% 10%",
          accent: "347 80% 55%",
          "accent-foreground": "210 40% 98%",
          border: "240 3.7% 15.9%",
          ring: "240 4.9% 83.9%",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        sparkle: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { opacity: "0.7" },
          "100%": { transform: "scale(1.2)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "zoom-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "zoom-in": "zoom-in 0.3s ease-out",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        gradient: "gradient-shift 3s ease infinite",
        sparkle: "sparkle 1.5s ease-out infinite",
      },
      backgroundSize: {
        "300%": "300% 300%",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    "px-2",
    "py-1",
    "rounded-sm",
    "bg-white/10",
    "text-xs",
    "font-medium",
    "uppercase",
    "tracking-wider",
    "border-border",
    "selection:bg-accent/10",
    "bg-background",
    "text-foreground",
    "antialiased",
  ],
};
