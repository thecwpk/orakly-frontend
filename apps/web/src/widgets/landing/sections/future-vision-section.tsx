export function FutureVisionSection() {
  return (
    <section className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Beyond prediction markets</p>
        <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          A narrative trading ecosystem — not a single product shot
        </h2>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
          Orakly Market is evolving into a complete narrative trading ecosystem for
          crypto. The future of crypto trading will be driven by narratives,
          sentiment, and attention — we are building the infrastructure for
          that future.
        </p>

        <div className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Future expansion</p>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground/95 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Narrative indexes",
              "Social trading",
              "Copy trading",
              "Creator markets",
              "AI-powered trend discovery",
              "Narrative analytics",
              "Reputation systems",
              "Liquidity incentives",
              "Cross-chain expansion",
            ].map((x) => (
              <li key={x} className="rounded-lg border border-border bg-card/30 px-3 py-2">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
