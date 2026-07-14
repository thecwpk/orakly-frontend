import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { faqItems } from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingEyebrow,
  landingH2,
  landingLead,
  landingBandInner,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";

/**
 * FAQ — native `<details>` accordion. Zero client JS, zero state,
 * works with keyboard + screen-reader out of the box.
 *
 * Plus a JSON-LD `FAQPage` block emitted server-side so search engines
 * can render rich answer cards directly in results.
 */

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function FaqSection() {
  return (
    <section
      id="faq"
      className={cn(
        landingSectionBand,
        "bg-[linear-gradient(180deg,oklch(0.11_0.018_268)_0%,var(--background)_40%,oklch(0.1_0.015_265)_100%)]",
      )}
    >
      <LandingReveal className={cn(landingBandInner, "relative")}>
        <p className={landingEyebrow}>FAQ</p>
        <h2 className={landingH2}>Honest answers, before sign-up.</h2>
        <p className={landingLead}>
          The questions every new trader should ask. Skim them in 90 seconds.
        </p>

        <ul className="mt-10 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {faqItems.map((item) => (
            <li key={item.q}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-foreground transition hover:bg-white/[0.03]">
                  <span className="text-sm font-semibold sm:text-[15px]">{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
              </details>
            </li>
          ))}
        </ul>
      </LandingReveal>

      <script
        type="application/ld+json"
        // SEO rich-result hint; never executed at runtime.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
    </section>
  );
}
