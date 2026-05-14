const P = "/pictures";

/** Your assets live in `apps/web/public/pictures/` (served as `/pictures/...`). */
export const LANDING_IMAGES = {
  hero: `${P}/herobackground.jpg`,
  /** Optional photo for Vision — add `public/pictures/values.jpg` to use it instead of the brand mark in UI. */
  values: `${P}/values.jpg`,
  /** Shipped under `public/brand/` — safe default so Vision never shows a broken image when `/pictures` is empty. */
  visionBrandMark: "/brand/orakly-mark-light.svg",
  background: `${P}/Background.jpg`,
} as const;
