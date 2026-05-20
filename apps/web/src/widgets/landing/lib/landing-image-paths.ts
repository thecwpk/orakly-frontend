import { BRAND_LOGO_FOR_DARK_NAV, BRAND_LOGO_WORDMARK_SVG } from "@/shared/constants/brand-logos";

/**
 * Brand asset paths for the marketing landing. Decorative raster JPGs
 * (`herobackground.jpg`, `Background.jpg`, `values.jpg`) were removed —
 * the active landing surface is fully CSS-driven for bandwidth + perf.
 *
 * `hero`, `background`, and `values` are kept as deprecation stubs that
 * resolve to the SVG brand mark so the inactive `premium-hero-section.tsx`
 * variant compiles. Delete them once the dead variant is removed.
 */
export const LANDING_IMAGES = {
  visionBrandMark: BRAND_LOGO_FOR_DARK_NAV,
  visionBrandMarkSvg: BRAND_LOGO_WORDMARK_SVG,
  /** @deprecated decorative raster removed — points at brand mark for compile safety. */
  hero: BRAND_LOGO_WORDMARK_SVG,
  /** @deprecated decorative raster removed — points at brand mark for compile safety. */
  background: BRAND_LOGO_WORDMARK_SVG,
  /** @deprecated decorative raster removed — points at brand mark for compile safety. */
  values: BRAND_LOGO_WORDMARK_SVG,
} as const;
