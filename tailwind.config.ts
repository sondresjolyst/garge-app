import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans:    ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['var(--font-syne)',   'var(--font-outfit)', 'sans-serif'],
                mono:    ['var(--font-mono)',   'ui-monospace', 'monospace'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    plugins: [],
} satisfies Config;