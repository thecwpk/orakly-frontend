import { MarketingLanding } from "./sections/marketing-landing";
import { MarketingNavbar } from "./sections/marketing-navbar";

export function MainLandingPage() {
  return (
    <div className="dark relative min-h-screen scroll-smooth bg-background text-foreground antialiased marketing-landing-canvas">
      <a
        href="#main"
        className="sr-only fixed left-3 top-3 z-[100] rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-yes focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to main content
      </a>
      <MarketingNavbar chrome="default" />
      <main id="main" className="w-full max-w-none pb-8 pt-0 sm:pb-10">
        <MarketingLanding />
      </main>
    </div>
  );
}
