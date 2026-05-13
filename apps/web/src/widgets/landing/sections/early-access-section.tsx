export function EarlyAccessSection() {
  return (
    <section id="early-access" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-yes/75">Early access</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">Join early access</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Get early access to Orakly before public launch. Be among the first
            users to explore live narrative markets, participate in beta access,
            and help shape the future of crypto prediction markets.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#final-cta" className="marketing-cta-primary px-6 py-3 text-sm">
              Join waitlist
            </a>
            <a
              href="#early-access"
              className="inline-flex rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-yes/25 hover:bg-yes/10"
            >
              Request early access
            </a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Forms and wallet flows ship separately — this section is intentionally
            static until launch plumbing is wired.
          </p>
        </div>
      </div>
    </section>
  );
}
