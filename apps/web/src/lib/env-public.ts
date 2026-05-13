/** Typed accessors for `NEXT_PUBLIC_*` vars only — never expose secrets client-side. */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
} as const;
