/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "rgb(var(--color-primary) / <alpha-value>)",
                "background-light": "#f6f8f8",
                "background-dark": "rgb(var(--color-bg) / <alpha-value>)",
                "charcoal": "#111818",
                "white": "rgb(var(--color-text) / <alpha-value>)",
                "black": "rgb(var(--color-inverse) / <alpha-value>)",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
        },
    },
    plugins: [],
}
