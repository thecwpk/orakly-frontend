import { permanentRedirect, redirect } from "next/navigation";

import { ROUTES } from "@/shared/constants/routes";

/** Site entry — trading hub at `/dapp` (marketing lives on separate orakly-landing). */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (sp.trending !== undefined) {
    const qs = new URLSearchParams();
    for (const [key, raw] of Object.entries(sp)) {
      if (raw === undefined) continue;
      if (Array.isArray(raw)) {
        for (const part of raw) qs.append(key, part);
      } else {
        qs.set(key, raw);
      }
    }
    redirect(`/markets?${qs.toString()}`);
  }

  permanentRedirect(ROUTES.dapp);
}
