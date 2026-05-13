import { TrendingUp } from "lucide-react";

const EXAMPLES = [
  "Will PEPE hit a new market cap high this week?",
  "Will AI coins outperform memes in the next 24 hours?",
  "Which narrative dominates this weekend?",
  "Will a new meme coin reach $10M first?",
] as const;

export function MarketsPreviewSection() {
  return (
    <section id="markets-preview" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border border-yes/30 bg-yes/10 text-yes">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Trade what happens next</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Trade live prediction markets built around meme coins, crypto
              narratives, market momentum, trend rotations, and real-time
              sentiment.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {EXAMPLES.map((q) => (
            <div
              key={q}
              className="rounded-xl border border-border bg-card/50 p-5 transition hover:border-yes/25 hover:bg-yes/5"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Example market</p>
              <p className="mt-2 text-sm font-medium leading-snug text-card-foreground">{q}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                <span className="font-mono text-xs text-muted-foreground">
                  Probability updates with liquidity
                </span>
                <span className="rounded border border-yes/30 bg-yes/10 px-2 py-0.5 font-mono text-[10px] text-yes">
                  LIVE
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          Market prices update dynamically based on trader conviction and
          liquidity movement.{" "}
          <span className="text-foreground/85">The market itself becomes the signal.</span>
        </p>
      </div>
    </section>
  );
}
