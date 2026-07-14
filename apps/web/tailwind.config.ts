import type { Config } from "tailwindcss";

/**
 * Production responsive scale.
 *
 * Breakpoint philosophy:
 *   - **base**: phones in portrait (≥320px)
 *   - **sm   40rem / 640px**: large phones / small tablets in portrait
 *   - **md   48rem / 768px**: tablets in portrait
 *   - **lg   64rem / 1024px**: laptops + tablets in landscape (wider nav chrome)
 *   - **xl   80rem / 1280px**: standard desktop
 *   - **2xl  96rem / 1536px**: large desktop
 *   - **3xl 120rem / 1920px**: ultra-wide / FHD trading workstation
 *   - **4xl 160rem / 2560px**: 4K-class monitors
 *
 * Use `3xl:` and `4xl:` selectively for content that *benefits* from extra
 * horizontal real estate — chart panels, dashboard grids, market lists. Most
 * content should still be vision-friendly width-clamped via `<Container>`.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        "3xl": "120rem",
        "4xl": "160rem",
      },
      maxWidth: {
        "screen-3xl": "120rem",
        "screen-4xl": "160rem",
      },
      colors: {
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        "background-card": "var(--background-card)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        yes: "var(--color-yes)",
        no: "var(--color-no)",
      },
    },
  },
  plugins: [],
};

export default config;
