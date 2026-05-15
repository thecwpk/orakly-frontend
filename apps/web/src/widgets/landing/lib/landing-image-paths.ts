import { BRAND_LOGO_FOR_DARK_NAV, BRAND_LOGO_WORDMARK_SVG } from "@/shared/constants/brand-logos";

const P = "/pictures";

/** Your assets live in `apps/web/public/pictures/` (served as `/pictures/...`). */
export const LANDING_IMAGES = {
  hero: `${P}/herobackground.jpg`,
  /** Optional photo for Vision — add `public/pictures/values.jpg` to use it instead of the brand mark in UI. */
  values: `${P}/values.jpg`,
  /** Same light wordmark as dark nav; SVG kept for tiny inline uses if needed. */
  visionBrandMark: BRAND_LOGO_FOR_DARK_NAV,
  visionBrandMarkSvg: BRAND_LOGO_WORDMARK_SVG,
  background: `${P}/Background.jpg`,
} as const;
