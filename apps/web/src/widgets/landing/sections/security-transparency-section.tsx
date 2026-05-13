import { Lock, ShieldCheck } from "lucide-react";

const ITEMS = [
  "On-chain settlement",
  "Decentralized market resolution",
  "Stablecoin-based trading",
  "Transparent market mechanics",
  "Community-driven ecosystem",
] as const;

export function SecurityTransparencySection() {
  return (
    <section id="security" className="marketing-section-slab border-b border-border py-16 sm:py-24">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:items-start">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden />
              Security & transparency
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
              Built on transparent infrastructure
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Serious surfaces earn trust through restraint — clear disclosures,
              boring typography, and no carnival gradients here.
            </p>
            <Lock className="mt-8 size-10 text-muted-foreground/50" aria-hidden />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ITEMS.map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-4 py-4 text-sm text-muted-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-yes/60" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          Designed for trust, clarity, and verifiable market outcomes.
        </p>
      </div>
    </section>
  );
}
