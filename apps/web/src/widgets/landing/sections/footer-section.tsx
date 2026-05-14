import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";

const LINKS = [
  { label: "Hub", href: ROUTES.marketsTrending },
  { label: "Markets", href: ROUTES.marketsBrowse },
  { label: "Portfolio", href: ROUTES.portfolio },
  { label: "Wallet", href: ROUTES.wallet },
] as const;

export function FooterSection() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/25 py-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-zinc-400 transition hover:text-zinc-200"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-[10px] text-zinc-600">
          Markets involve risk · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
