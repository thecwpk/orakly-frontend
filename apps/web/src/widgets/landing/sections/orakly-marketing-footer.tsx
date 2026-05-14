import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const NAVIGATE = [
  { label: "Markets", href: "#markets" },
  { label: "Dapp", href: ROUTES.marketsBrowse },
  { label: "Docs", href: "#footer" },
  { label: "Community", href: "#community" },
  { label: "Help", href: "#early-access" },
] as const;

const SOCIALS = [
  { label: "X / Twitter", href: "#footer" },
  { label: "Telegram", href: "#footer" },
  { label: "Discord", href: "#footer" },
] as const;

const footerPadX = "px-[var(--space-4)] sm:px-[var(--space-6)] lg:px-[var(--space-7)]";

export function OraklyMarketingFooter() {
  return (
    <footer
      id="footer"
      className="relative z-[1] border-t border-[color:var(--border-soft)] bg-[var(--bg-0)] text-[var(--text-muted)] antialiased shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    >
      <div className={cn("mx-auto w-full max-w-7xl py-6 sm:py-7", footerPadX)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">ORAKLY MARKET</p>
          <p className="mt-1 text-sm font-semibold tracking-tight text-[var(--text-primary)]">Orakly Market</p>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Trade live crypto narratives through transparent YES/NO prediction markets and on-chain settlement infrastructure.
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Navigate</p>
          <nav className="mt-3 flex flex-col gap-1.5 text-[13px]">
            {NAVIGATE.map(({ label, href }) => (
              <a key={label} href={href} className="text-[var(--text-secondary)] transition hover:text-[var(--accent-soft)]">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Socials</p>
          <nav className="mt-3 flex flex-col gap-1.5 text-[13px]">
            {SOCIALS.map(({ label, href }) => (
              <a key={label} href={href} className="text-[var(--text-secondary)] transition hover:text-[var(--accent-soft)]">
                {label}
              </a>
            ))}
          </nav>
        </div>
        </div>
      </div>

      <div className="w-full border-t border-[color:var(--border-soft)] bg-[var(--bg-1)]">
        <div className={cn("mx-auto w-full max-w-7xl py-5", footerPadX)}>
        <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-secondary)]">Risk:</span> Prediction markets involve substantial loss risk.
          Prices are volatile. This site is not legal, tax, or investment advice. Features vary by jurisdiction.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
          <a href="#footer" className="text-[var(--text-muted)] transition hover:text-[var(--accent-soft)]">
            Terms
          </a>
          <a href="#footer" className="text-[var(--text-muted)] transition hover:text-[var(--accent-soft)]">
            Privacy
          </a>
          <a href="#footer" className="text-[var(--text-muted)] transition hover:text-[var(--accent-soft)]">
            Compliance
          </a>
        </div>
        <p className="mt-4 font-mono text-[10px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} Orakly Market. Built for transparent crypto prediction markets.
        </p>
        </div>
      </div>
    </footer>
  );
}
