/**
 * SIAM with Pure MAC Design System
 * Professional meeting AI interface by Matthew Adam Carpenter
 * Clean, elegant, timeless design - no cyberpunk, just sophistication
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      scale: {
        '175': '1.75',
        '200': '2',
      },
      colors: {
        border: "rgba(255, 255, 255, 0.08)", /* MAC Design System: subtle border */
        input: "rgba(255, 255, 255, 0.12)", /* Slightly more visible for form inputs */
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#baddff",
          300: "#7cc0ff",
          400: "#3385ff",
          500: "#0969da",
          600: "#0052cc",
          700: "#0041a3",
          800: "#003d82",
          900: "#00316b",
          DEFAULT: "#3385ff",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#141414",
          foreground: "#ffffff",
        },
        accent: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#8533ff",
          500: "#8b5cf6",
          600: "#5200cc",
          700: "#6b21a8",
          800: "#581c87",
          900: "#4c1d95",
          DEFAULT: "#8533ff",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#666666",
          foreground: "#b3b3b3",
        },
        destructive: {
          DEFAULT: "#ff4444",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#141414",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#141414",
          foreground: "#ffffff",
        },
        "mac-surface": {
          bg: "#0a0a0a",
          elevated: "#141414",
        },
        "mac-text": {
          primary: "#ffffff",
          secondary: "#b3b3b3",
          muted: "#666666",
        },
        "mac-border": {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          elevated: "rgba(255, 255, 255, 0.2)",
        },
        "mac-state": {
          hover: "rgba(255, 255, 255, 0.05)",
          focus: "#3385ff",
          disabled: "#333333",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        display: ["system-ui", "-apple-system", "sans-serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Consolas", "monospace"],
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
      },
      fontSize: {
        display: [
          "3.75rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            fontWeight: "100",
          },
        ],
        "heading-xl": [
          "2.25rem",
          {
            lineHeight: "1.2",
            fontWeight: "200",
          },
        ],
        heading: [
          "1.875rem",
          {
            lineHeight: "1.3",
            fontWeight: "200",
          },
        ],
        title: [
          "1.5rem",
          {
            lineHeight: "1.5",
            fontWeight: "300",
          },
        ],
        body: [
          "1rem",
          {
            lineHeight: "1.75",
            fontWeight: "300",
          },
        ],
      },
      boxShadow: {
        "mac-card": "0 4px 12px rgba(0, 0, 0, 0.5)",
        "mac-elevated": "0 8px 24px rgba(0, 0, 0, 0.5)",
        "mac-purple-glow": "0 4px 12px rgba(133, 51, 255, 0.4)",
        "mac-blue-glow": "0 4px 12px rgba(51, 133, 255, 0.3)",
        "mac-glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "mac-glow": {
          "0%, 100%": {
            textShadow: "0 0 20px #8533ff",
          },
          "50%": {
            textShadow: "0 0 30px #8533ff, 0 0 40px #8533ff",
          },
        },
        "mac-shimmer": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "mac-float": {
          "0%, 100%": {
            transform: "translateY(0px) rotate(0deg)",
          },
          "33%": {
            transform: "translateY(-20px) rotate(120deg)",
          },
          "66%": {
            transform: "translateY(10px) rotate(240deg)",
          },
        },
        "mac-pulse": {
          "0%, 100%": {
            opacity: "0.8",
          },
          "50%": {
            opacity: "1",
          },
        },
        "mac-fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "mac-glow": "mac-glow 2s ease-in-out infinite alternate",
        "mac-shimmer": "mac-shimmer 3s infinite",
        "mac-float": "mac-float 6s ease-in-out infinite",
        "mac-pulse": "mac-pulse 2s ease-in-out infinite",
        "mac-fade-in": "mac-fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
