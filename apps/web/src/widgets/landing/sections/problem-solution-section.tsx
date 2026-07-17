import { Eye, Gauge, Layers, LockOpen } from "lucide-react";

const PAIRS = [
  {
    pain: "Opaque pricing & settlement",
    fix: "Transparent YES/NO mechanics. The probability you see is what traders trade.",
    icon: Eye,
  },
  {
    pain: "Interfaces built for elections, not rotations",
    fix: "Built for meme cycles, narratives, and sentiment that actually move crypto.",
    icon: Layers,
  },
  {
    pain: "Slow feedback loops",
    fix: "Prices update as conviction moves, so you can react before the narrative is priced in.",
    icon: Gauge,
  },
  {
    pain: "Black-box resolution",
    fix: "Decentralized resolution & on-chain payouts you can verify.",
    icon: LockOpen,
  },
] as const;

export function ProblemSolutionSection() {
  return (
    <section className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Built for traders who are tired of noise
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Straight language, no fluff. Here is what breaks today, and how Orakly
          is designed differently.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {PAIRS.map(({ pain, fix, icon: Icon }) => (
            <div
              key={pain}
              className="grid gap-4 rounded-2xl border border-border bg-card/40 p-6 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-no/85">
                  Problem
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{pain}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-yes/85">
                  Orakly
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                  {fix}
                </p>
              </div>
              <div className="flex items-start justify-end">
                <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/30 text-yes ring-1 ring-border">
                  <Icon className="size-5" aria-hidden />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
