const TESTIMONIALS = [
  {
    quote:
      "Finally something that matches how crypto actually moves — narratives first, charts second.",
    name: "Mira K.",
    meta: "Desk trader · 6 yrs crypto",
    initials: "MK",
  },
  {
    quote:
      "I care about resolution clarity. Orakly's framing made the settlement story obvious before I sized.",
    name: "Jordan L.",
    meta: "On-chain PM · DeFi",
    initials: "JL",
  },
  {
    quote:
      "The YES/NO tape feels like a market, not a raffle ticket. That matters when liquidity is thin.",
    name: "Elias R.",
    meta: "Community markets · beta",
    initials: "ER",
  },
] as const;

export function SocialProofSection() {
  return (
    <section id="social-proof" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Early voices</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
            Traders like you, testing the narrative layer
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Illustrative beta feedback — composite quotes for positioning only,
            not verified endorsements.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-yes/35 to-primary/25 text-sm font-semibold text-foreground"
                  aria-hidden
                >
                  {t.initials}
                </span>
                <div>
                  <figcaption className="text-sm font-semibold text-foreground">{t.name}</figcaption>
                  <p className="text-[11px] text-muted-foreground">{t.meta}</p>
                </div>
              </div>
              <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                “{t.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-1 text-yes/85">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-[13px]">
                    {s}
                  </span>
                ))}
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
