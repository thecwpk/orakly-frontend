/** Canonical public site URL for metadata, robots, and AI discovery. */
export function getPublicSiteUrl(): string {
  const fallback = "https://orakly-frontend-web.vercel.app";
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    fallback;

  if (!raw || /YOUR-PROJECT|your-project/i.test(raw)) {
    return fallback;
  }

  return raw.replace(/\/$/, "");
}
