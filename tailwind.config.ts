import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        playful: ["var(--font-playful)"],
      },
      boxShadow: {
        neon: "0 10px 45px rgba(123, 97, 255, 0.45), 0 0 25px rgba(77, 255, 247, 0.35)",
        "neon-soft": "0 10px 30px rgba(77, 255, 247, 0.25)",
        "float-card":
          "0 35px 80px rgba(15, 23, 42, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      },
      dropShadow: {
        glow: "0 0 15px rgba(77, 255, 247, 0.45)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
        emergency: "hsl(var(--emergency))",
        urgent: "hsl(var(--urgent))",
        warning: "hsl(var(--warning))",
        success: "hsl(var(--success))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        floaty: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(123, 97, 255, 0.4), 0 0 25px rgba(77, 255, 247, 0.45)",
          },
          "50%": {
            boxShadow:
              "0 0 35px 5px rgba(123, 97, 255, 0.3), 0 0 55px rgba(77, 255, 247, 0.65)",
          },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-pop": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer-slide": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
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
      },
      animation: {
        floaty: "floaty 10s ease-in-out infinite",
        glow: "pulse-glow 3.4s ease-in-out infinite",
        "fade-up": "fade-up 0.65s ease",
        "pop-in": "scale-pop 0.45s ease",
        shimmer: "shimmer-slide 2.5s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
