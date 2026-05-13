export function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      className="marketing-section-slab relative overflow-hidden border-b border-border py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_70%_15%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative z-[1] mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Don&apos;t just watch the market. Predict it.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
          Trade the next crypto narrative before the crowd arrives.
        </p>
        <p className="mx-auto mt-3 font-mono text-xs uppercase tracking-[0.18em] text-yes/80">
          Orakly Market · Predict the narrative.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="#early-access" className="marketing-cta-primary px-8 py-3.5 text-sm shadow-lg">
            Launch App
          </a>
          <a
            href="#early-access"
            className="inline-flex rounded-full border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-yes/25 hover:bg-yes/10"
          >
            Join Early Access
          </a>
        </div>
        <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-muted-foreground">
          Prediction markets involve risk of loss. Nothing on this page is
          investment advice. Trade only what you can afford to lose.
        </p>
      </div>
    </section>
  );
}
