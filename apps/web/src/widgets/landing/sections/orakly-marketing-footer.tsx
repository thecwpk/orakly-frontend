const NAVIGATE = [
  { label: "Markets", href: "#markets-preview" },
  { label: "Dapp", href: "#how-it-works" },
  { label: "Docs", href: "#footer" },
  { label: "Community", href: "#community" },
  { label: "Help", href: "#early-access" },
] as const;

const SOCIALS = [
  { label: "X / Twitter", href: "#footer" },
  { label: "Telegram", href: "#footer" },
  { label: "Discord", href: "#footer" },
] as const;

export function OraklyMarketingFooter() {
  return (
    <footer id="footer" className="border-t border-border bg-background py-14 text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-semibold tracking-tight text-foreground">Orakly Market</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            Trade live crypto narratives through transparent YES/NO prediction
            markets and on-chain settlement infrastructure.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">Navigate</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            {NAVIGATE.map(({ label, href }) => (
              <a key={label} href={href} className="transition hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">Socials</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            {SOCIALS.map(({ label, href }) => (
              <a key={label} href={href} className="transition hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">Apps</p>
          <p className="mt-2 text-xs text-muted-foreground/90">App store badges can slot here post-launch.</p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-border px-4 pt-8 sm:px-6 lg:px-8">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground/80">Risk disclaimer:</strong>{" "}
          Trading prediction markets involves substantial risk and may not be
          suitable for all participants. Prices can be volatile and you may lose
          your principal. Past performance of similar markets does not guarantee
          future results. This website does not constitute legal, tax, or
          investment advice. Availability of features may vary by jurisdiction.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
          <a href="#footer" className="text-muted-foreground transition hover:text-foreground">
            Terms
          </a>
          <a href="#footer" className="text-muted-foreground transition hover:text-foreground">
            Privacy
          </a>
          <a href="#footer" className="text-muted-foreground transition hover:text-foreground">
            Compliance
          </a>
        </div>
        <p className="mt-8 font-mono text-[10px] text-muted-foreground/80">
          © {new Date().getFullYear()} Orakly Market. Built for transparent crypto
          prediction markets.
        </p>
      </div>
    </footer>
  );
}
