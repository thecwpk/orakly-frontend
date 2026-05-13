import { Cpu, Zap } from "lucide-react";

const BULLETS = [
  "Crypto-native narratives",
  "Meme market cycles",
  "Fast-moving sentiment",
  "Real-time probability discovery",
  "Transparent on-chain participation",
] as const;

export function WhyOraklySection() {
  return (
    <section id="why-orakly" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-yes/90">
              <Zap className="size-5" aria-hidden />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Why Orakly
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Built for modern crypto markets
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Traditional prediction platforms focus on mainstream events and
              static market structures.
            </p>
            <p className="mt-4 font-medium text-foreground/90">Orakly is designed specifically for:</p>
          </div>
          <ul className="space-y-3">
            {BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 text-sm text-card-foreground"
              >
                <Cpu className="size-4 shrink-0 text-yes/75" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-center text-sm font-medium text-muted-foreground">
          Built for users who move with the market — not after it.
        </p>
      </div>
    </section>
  );
}
