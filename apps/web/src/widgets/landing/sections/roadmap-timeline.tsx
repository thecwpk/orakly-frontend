import { cn } from "@/lib/utils";
import { roadmapQuarters } from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingBody,
  landingEyebrow,
  landingH2,
  landingH3,
  landingLead,
  landingBandInner,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";

/**
 * Quarter swim-lane roadmap — replaces v1 single-column "Next / Later" list
 * that read as vaporware. Quarter labels are real (Q3'26, Q4'26, 2027) and
 * tied to seed market close dates so calendar honesty stays intact.
 */

const STATUS_TONE: Record<string, string> = {
  Shipping: "bg-yes/15 text-yes border-yes/25",
  Next: "bg-primary/15 text-primary-foreground/95 border-primary/25",
  Planned: "bg-muted/30 text-muted-foreground border-white/[0.08]",
  Vision: "bg-white/[0.04] text-muted-foreground border-white/[0.08]",
};

export function RoadmapTimeline() {
  return (
    <section
      id="roadmap"
      className={cn(
        landingSectionBand,
        "bg-[radial-gradient(ellipse_90%_70%_at_10%_0%,oklch(0.38_0.08_55_/_0.14),transparent_55%),linear-gradient(120deg,oklch(0.14_0.02_25),hsl(var(--background))_45%,oklch(0.12_0.018_35))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,220,200,0.04)_1px,transparent_0)] [background-size:20px_20px]"
        aria-hidden
      />
      <LandingReveal className={cn(landingBandInner, "relative")}>
        <p className={cn(landingEyebrow, "text-amber-200/70")}>Roadmap</p>
        <h2 className={landingH2}>What ships, when.</h2>
        <p className={landingLead}>
          Quarters, not vibes. The closer the lane, the more committed the scope.
        </p>

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roadmapQuarters.map((q) => (
            <li
              key={q.quarter}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {q.quarter}
                </p>
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    STATUS_TONE[q.status] ?? STATUS_TONE.Planned,
                  )}
                >
                  {q.status}
                </span>
              </div>
              <ul className="mt-5 space-y-4">
                {q.items.map((item) => (
                  <li key={item.title}>
                    <h3 className={landingH3}>{item.title}</h3>
                    <p className={cn(landingBody, "mt-1 text-[12.5px]")}>{item.note}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </LandingReveal>
    </section>
  );
}
