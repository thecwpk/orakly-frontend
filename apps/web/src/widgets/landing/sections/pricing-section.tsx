export function PricingSection() {
  return (
    <section id="fees" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fees & structure</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">Transparency beats surprises</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Numbers shown as conceptual placeholders until public fee schedules ship
            — layout demonstrates how we will communicate spreads and charges.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 font-semibold text-muted-foreground"> </th>
                <th className="px-4 py-3 font-semibold text-foreground">Orakly Market</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Typical prediction UI</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/80">
                <td className="px-4 py-3 font-medium text-foreground">Spread clarity</td>
                <td className="px-4 py-3 text-yes/90">Shown pre-trade</td>
                <td className="px-4 py-3 text-muted-foreground/80">Often buried</td>
              </tr>
              <tr className="border-b border-border/80">
                <td className="px-4 py-3 font-medium text-foreground">Settlement path</td>
                <td className="px-4 py-3 text-yes/90">On-chain, verifiable</td>
                <td className="px-4 py-3 text-muted-foreground/80">Varies</td>
              </tr>
              <tr className="border-b border-border/80">
                <td className="px-4 py-3 font-medium text-foreground">Hidden adjustments</td>
                <td className="px-4 py-3 text-yes/90">Avoided by design</td>
                <td className="px-4 py-3 text-muted-foreground/80">Common complaint</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Trading rail</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-yes/30 bg-yes/10 px-2 py-0.5 text-xs font-semibold text-yes">
                    Stablecoin-native
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground/80">Mixed</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Final fee tiers will be published ahead of mainnet launch. Nothing here
          is a billing quote.
        </p>
      </div>
    </section>
  );
}
