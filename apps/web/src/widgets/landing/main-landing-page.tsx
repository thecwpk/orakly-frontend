import { MarketingLanding } from "./sections/marketing-landing";
import { MarketingNavbar } from "./sections/marketing-navbar";

export function MainLandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground antialiased dark">
      <MarketingNavbar chrome="default" />
      <main className="w-full max-w-none pb-8 pt-0 sm:pb-10">
        <MarketingLanding />
      </main>
    </div>
  );
}
