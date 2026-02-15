import tailwindAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
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
            fontFamily: {
                sans: [
                    "-apple-system",
                    "BlinkMacSystemFont",
                    '"SF Pro Display"',
                    '"SF Pro Text"',
                    '"Helvetica Neue"',
                    "Helvetica",
                    "Arial",
                    "system-ui",
                    "sans-serif",
                ],
            },
            spacing: {
                '13': '3.25rem',
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
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'apple-sm': 'var(--shadow-sm)',
                'apple': 'var(--shadow-md)',
                'apple-lg': 'var(--shadow-lg)',
                'apple-xl': 'var(--shadow-xl)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "sheet-up": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                },
                "sheet-down": {
                    from: { transform: "translateY(0)" },
                    to: { transform: "translateY(100%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "sheet-up": "sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
                "sheet-down": "sheet-down 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
            },
        },
    },
    plugins: [tailwindAnimate],
}
