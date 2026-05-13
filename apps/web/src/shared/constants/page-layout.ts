import type { CSSProperties } from "react";

const GUTTER = "var(--app-page-gutter-x, 1.25rem)";

/**
 * Horizontal inset for `AppShell` / `MinimalMarketShell` `<main>`.
 * Inline styles so padding always applies (Tailwind arbitrary `max(a, b)` can be
 * dropped or misparsed depending on version / scan).
 */
export const appMainPageInsetStyle = {
  paddingLeft: `max(${GUTTER}, env(safe-area-inset-left, 0px))`,
  paddingRight: `max(${GUTTER}, env(safe-area-inset-right, 0px))`,
} satisfies CSSProperties;

/** Full-bleed sticky row: cancel shell inset then re-pad inner (markets explorer toolbar). */
export const appStickyToolbarBleedStyle = {
  marginLeft: `calc(-1 * max(${GUTTER}, env(safe-area-inset-left, 0px)))`,
  marginRight: `calc(-1 * max(${GUTTER}, env(safe-area-inset-right, 0px)))`,
  paddingLeft: `max(${GUTTER}, env(safe-area-inset-left, 0px))`,
  paddingRight: `max(${GUTTER}, env(safe-area-inset-right, 0px))`,
} satisfies CSSProperties;
