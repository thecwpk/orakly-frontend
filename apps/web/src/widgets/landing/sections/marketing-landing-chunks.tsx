/**
 * v1 marketing chunks (Vision / Why Orakly / Community / Security /
 * Future / Early Access) were merged into focused new components under
 * `./why-orakly-merged`, `./trust-strip`, `./roadmap-timeline`,
 * `./faq-section`, and `./waitlist-final-cta`.
 *
 * The exports below are no-op shims kept to avoid import churn anywhere
 * still referencing the old names. Delete in the next cleanup pass once
 * Grep confirms zero callers outside this folder.
 */

export function MarketingLandingVision() {
  return null;
}
export function MarketingLandingWhyOrakly() {
  return null;
}
export function MarketingLandingCommunity() {
  return null;
}
export function MarketingLandingSecurity() {
  return null;
}
export function MarketingLandingFuture() {
  return null;
}
export function MarketingLandingEarlyAccess() {
  return null;
}
