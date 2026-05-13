import { BadgeCheck, Landmark, Shield } from "lucide-react";

const CHIPS = [
  "Transparent YES / NO pricing",
  "On-chain settlement rails",
  "Community-shaped markets",
  "Stablecoin-native trading",
] as const;

export function TrustBar() {
  return (
    <section id="trust" className="border-b border-border bg-muted/35 py-3 text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] font-medium">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Shield className="size-4 text-yes/85" aria-hidden />
            Built for verifiable outcomes
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <BadgeCheck className="size-4 text-muted-foreground" aria-hidden />
            No surprise settlement logic
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Landmark className="size-4 text-muted-foreground" aria-hidden />
            Stablecoin markets · transparent mechanics
          </span>
        </div>
        <div className="hidden h-4 w-px bg-border sm:block" aria-hidden />
        <div className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
