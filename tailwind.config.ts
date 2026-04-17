import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#000000',
                    primary: '#00E5FF',
                    accent: '#00B8D4',
                    light: '#FFFFFF'
                }
            }
        },
    },
    plugins: [],
};
export default config;