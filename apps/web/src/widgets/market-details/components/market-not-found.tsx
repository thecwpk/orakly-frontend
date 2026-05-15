"use client";

import { PrefetchLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";

export function MarketNotFound({ slug }: { slug: string }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Market not found
      </p>
      <h1 className="mt-3 text-lg font-semibold text-foreground">
        No market for &ldquo;{slug}&rdquo;
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This URL may be outdated, or the market was removed from the database.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <PrefetchLink
          href={ROUTES.dapp}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to hub
        </PrefetchLink>
        <PrefetchLink
          href={ROUTES.discover}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          Browse markets
        </PrefetchLink>
      </div>
    </main>
  );
}
