/**
 * SIAM with MAC Design System - Teal Theme
 * Professional AI interface by Matthew Adam Carpenter
 * Clean, elegant, timeless design with teal accent palette
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
        border: "hsl(var(--border))", /* Uses CSS variable for theme support */
        input: "hsl(var(--input))", /* Uses CSS variable for theme support */
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        /* Teal Primary Palette */
        primary: {
          50: "#e0f7fa",
          100: "#b2ebf2",
          200: "#80deea",
          300: "#4dd0e1",
          400: "#26c6da",
          500: "#00bcd4",
          600: "#00acc1",
          700: "#0097a7",
          800: "#00838f",
          900: "#006064",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        /* Teal Accent (darker shade for variety) */
        accent: {
          50: "#e0f7fa",
          100: "#b2ebf2",
          200: "#80deea",
          300: "#4dd0e1",
          400: "#00bcd4",
          500: "#00acc1",
          600: "#0097a7",
          700: "#00838f",
          800: "#006064",
          900: "#004d40",
          DEFAULT: "#00bcd4",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
          focus: "#26c6da",
          disabled: "#333333",
        },
        /* Teal-specific utilities */
        "mac-teal": {
          400: "#26c6da",
          500: "#00bcd4",
          600: "#00acc1",
          700: "#0097a7",
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
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Consolas", "Liberation Mono", "monospace"],
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
        "mac-teal-glow": "0 4px 12px rgba(38, 198, 218, 0.4)",
        "mac-teal-glow-strong": "0 8px 20px rgba(38, 198, 218, 0.5)",
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
            textShadow: "0 0 20px #26c6da",
          },
          "50%": {
            textShadow: "0 0 30px #26c6da, 0 0 40px #00bcd4",
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
