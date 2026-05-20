import { FaqSection } from "@/widgets/landing/sections/faq-section";
import { HowItWorksAnimated } from "@/widgets/landing/sections/how-it-works-animated";
import { LiveMarketsGrid } from "@/widgets/landing/sections/live-markets-grid";
import { MarketingLandingFooter } from "@/widgets/landing/sections/marketing-landing-footer";
import { RoadmapTimeline } from "@/widgets/landing/sections/roadmap-timeline";
import { TrustStrip } from "@/widgets/landing/sections/trust-strip";
import { WaitlistFinalCta } from "@/widgets/landing/sections/waitlist-final-cta";
import { WhyOraklyMerged } from "@/widgets/landing/sections/why-orakly-merged";

export function MarketingLandingSections() {
  return (
    <>
      <LiveMarketsGrid />
      <HowItWorksAnimated />
      <WhyOraklyMerged />
      <TrustStrip />
      <RoadmapTimeline />
      <FaqSection />
      <WaitlistFinalCta />
      <MarketingLandingFooter />
    </>
  );
}
