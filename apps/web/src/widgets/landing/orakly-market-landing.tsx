import { CommunitySection } from "./sections/community-section";
import { CoreFeaturesSection } from "./sections/core-features-section";
import { EarlyAccessSection } from "./sections/early-access-section";
import { FinalCtaSection } from "./sections/final-cta-section";
import { FutureVisionSection } from "./sections/future-vision-section";
import { HowItWorksSection } from "./sections/how-it-works-section";
import { LiveTerminalSection } from "./sections/live-terminal-section";
import { MarketingHero } from "./sections/marketing-hero";
import { MarketingNavbar } from "./sections/marketing-navbar";
import { MarketsPreviewSection } from "./sections/markets-preview-section";
import { OraklyMarketingFooter } from "./sections/orakly-marketing-footer";
import { PricingSection } from "./sections/pricing-section";
import { ProblemSolutionSection } from "./sections/problem-solution-section";
import { SecurityTransparencySection } from "./sections/security-transparency-section";
import { SocialProofSection } from "./sections/social-proof-section";
import { TrustBar } from "./sections/trust-bar";
import { VisionSection } from "./sections/vision-section";
import { WhyOraklySection } from "./sections/why-orakly-section";

export function OraklyMarketLanding() {
  return (
    <div className="orakly-market-landing dark min-h-screen scroll-smooth bg-background text-foreground antialiased">
      <MarketingNavbar />
      <main>
        <MarketingHero />
        <TrustBar />
        <ProblemSolutionSection />
        <MarketsPreviewSection />
        <VisionSection />
        <WhyOraklySection />
        <CoreFeaturesSection />
        <LiveTerminalSection />
        <HowItWorksSection />
        <CommunitySection />
        <SecurityTransparencySection />
        <FutureVisionSection />
        <SocialProofSection />
        <PricingSection />
        <EarlyAccessSection />
        <FinalCtaSection />
      </main>
      <OraklyMarketingFooter />
    </div>
  );
}
