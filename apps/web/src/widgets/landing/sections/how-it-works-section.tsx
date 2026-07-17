import { ArrowRight, Rocket, Search, WalletCards } from "lucide-react";

const STEPS = [
  {
    title: "Explore markets",
    body: "Browse live prediction markets built around meme coins, narratives, trending sectors, events, and sentiment.",
    icon: Search,
  },
  {
    title: "Buy YES or NO",
    body: "Trade with stablecoins in seconds. Each market has YES and NO shares, and prices track live probability.",
    icon: WalletCards,
  },
  {
    title: "Trade positions",
    body: "Enter, exit anytime before settlement, and react as conviction shifts. Prices update continuously.",
    icon: ArrowRight,
  },
  {
    title: "Settle on-chain",
    body: "Winning positions settle automatically with transparent, verifiable payouts on decentralized rails.",
    icon: Rocket,
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">How Orakly works</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
            Four steps · under five seconds each
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, body, icon: Icon }, i) => (
            <div key={title} className="marketing-how-card p-6">
              <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <div className="mt-3 flex size-10 items-center justify-center rounded-xl border border-yes/30 bg-yes/10 text-yes">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold text-card-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
