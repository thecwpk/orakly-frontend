import { HeroDashboardPreview } from "./hero-dashboard-preview";
import { MarketingTicker } from "./marketing-ticker";

const STATS = [
  { label: "Market Updates", value: "Real-Time" },
  { label: "Trade Format", value: "YES / NO" },
  { label: "Settlement", value: "On-Chain" },
  { label: "Infrastructure", value: "Transparent" },
] as const;

export function MarketingHero() {
  return (
    <section id="top" className="marketing-hero-shell relative overflow-hidden text-foreground">
      <div className="marketing-hero-orb-left" aria-hidden />
      <div className="marketing-hero-orb-right" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="flex flex-col justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-yes/85">
            Orakly Market
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            The Prediction Market for Crypto Attention.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Trade crypto narratives with transparent on-chain odds.
          </p>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground/90">
            Orakly transforms market attention, conviction, and sentiment into
            tradable YES and NO positions — giving you a faster and more
            transparent way to participate in crypto narratives.
          </p>
          <p className="mt-3 text-sm font-medium text-foreground/90">
            Built for the next generation of crypto traders.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#final-cta" className="marketing-cta-primary px-6 py-3 text-sm shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--yes)_40%,transparent)]">
              Launch App
            </a>
            <a
              href="#markets-preview"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-yes/30 hover:bg-yes/10"
            >
              Explore Markets
            </a>
            <a
              href="#early-access"
              className="inline-flex items-center justify-center rounded-full border border-transparent px-2 py-3 text-sm font-medium text-yes underline-offset-4 hover:text-yes/90 hover:underline sm:px-4"
            >
              Join Early Access
            </a>
          </div>

          <p className="mt-10 max-w-xl border-l-2 border-yes/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
            No hidden spread logic. No opaque settlement flow. Transparent
            markets built for real-time crypto conviction.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold text-card-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 lg:mt-0 lg:flex lg:items-center">
          <HeroDashboardPreview />
        </div>
      </div>

      <MarketingTicker />
    </section>
  );
}
