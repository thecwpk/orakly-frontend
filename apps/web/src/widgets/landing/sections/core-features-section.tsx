import { Check, Users } from "lucide-react";

type Feature = {
  title: string;
  does: string;
  matters: string;
  better: string;
  frame: "yesno" | "narrative" | "community" | "settle";
};

const FEATURES: Feature[] = [
  {
    title: "Real-Time Prediction Markets",
    does: "Trade probability curves powered by live conviction.",
    matters: "You react to narrative shifts instead of stale headlines.",
    better: "Pricing moves with every trade, not end-of-day resets.",
    frame: "yesno",
  },
  {
    title: "Narrative Trading",
    does: "Track emerging crypto narratives before they go mainstream.",
    matters: "Capture rotations early when attention is still forming.",
    better: "Purpose-built for crypto-native stories, not generic news bets.",
    frame: "narrative",
  },
  {
    title: "Community-Driven Discovery",
    does: "Suggest markets, submit narratives, and shape what trades next.",
    matters: "Liquidity follows attention. Community participation surfaces what matters.",
    better: "Markets evolve with the community instead of a fixed catalog.",
    frame: "community",
  },
  {
    title: "Transparent Settlement",
    does: "Decentralized resolution with verifiable on-chain payouts.",
    matters: "Know how outcomes are decided before you size a position.",
    better: "Designed for auditability with clearer, verifiable resolutions.",
    frame: "settle",
  },
];

function DeviceFrame({
  variant,
  align,
}: {
  variant: Feature["frame"];
  align: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right" ? "lg:order-last" : ""
      }
    >
      <div className="marketing-cycle-panel relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-border/60">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-muted-foreground/35" />
            <span className="size-2 rounded-full bg-muted-foreground/35" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            orakly.feature.{variant}
          </span>
        </div>
        <div className="aspect-[16/10] p-4">
          {variant === "yesno" && (
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-2">
                <div className="h-2 w-3/4 rounded bg-muted/50" />
                <div className="h-2 w-1/2 rounded bg-muted/30" />
              </div>
              <div className="flex gap-2">
                <div className="h-16 flex-1 rounded-lg bg-yes/18 ring-1 ring-yes/25" />
                <div className="h-16 flex-1 rounded-lg bg-no/14 ring-1 ring-no/22" />
              </div>
              <div className="h-12 rounded-lg bg-gradient-to-r from-yes/10 to-transparent" />
            </div>
          )}
          {variant === "narrative" && (
            <div className="flex h-full flex-col gap-2">
              {[60, 85, 45, 72].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded bg-muted/40" />
                  <div
                    className="h-2 rounded bg-yes/40"
                    style={{ width: `${w}px` }}
                  />
                </div>
              ))}
              <div className="mt-auto h-16 rounded-lg border border-dashed border-border bg-muted/15" />
            </div>
          )}
          {variant === "community" && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Users className="size-10 text-yes/40" aria-hidden />
              <div className="h-2 w-4/5 rounded bg-muted/40" />
              <div className="h-2 w-3/5 rounded bg-muted/25" />
            </div>
          )}
          {variant === "settle" && (
            <div className="flex h-full flex-col justify-center gap-3 font-mono text-[10px] text-muted-foreground">
              <div className="rounded border border-border bg-muted/25 p-3">
                <p className="inline-flex items-center gap-1 text-yes/90">
                  <Check className="size-3" aria-hidden />
                  proposal verified
                </p>
                <p className="mt-2 text-muted-foreground">on-chain payout queued</p>
              </div>
              <div className="h-2 rounded bg-muted/40" />
              <div className="h-2 w-5/6 rounded bg-muted/25" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoreFeaturesSection() {
  return (
    <section id="features" className="marketing-section-slab border-b border-border py-16 sm:py-24">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Core features</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Depth without the feature dump
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Four primitives that cover how you discover, trade, and settle on
            crypto narratives.
          </p>
        </div>

        <div className="mt-16 space-y-20 lg:space-y-24">
          {FEATURES.map((f, i) => {
            const alignRight = i % 2 === 1;
            return (
              <div
                key={f.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <DeviceFrame variant={f.frame} align={alignRight ? "right" : "left"} />
                <div className={alignRight ? "lg:order-first" : ""}>
                  <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                  <dl className="mt-6 space-y-4 text-sm">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        What it does
                      </dt>
                      <dd className="mt-1 text-muted-foreground/95">{f.does}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Why it matters
                      </dt>
                      <dd className="mt-1 text-muted-foreground/95">{f.matters}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-yes/75">
                        How it is different
                      </dt>
                      <dd className="mt-1 text-foreground/90">{f.better}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Also ships with
          </p>
          <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <li>Liquid probability engine · continuous repricing</li>
            <li>Trade anytime · exit before settlement</li>
            <li>Leaderboards & reputation · win rate tracking</li>
            <li>Shareable markets · built for distribution</li>
            <li>Meme coin verticals · caps & rotations</li>
            <li>Risk-aware workflows · size as conviction shifts</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
