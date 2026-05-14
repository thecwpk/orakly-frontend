"use client";

import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  Menu,
  Plus,
  Settings,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PremiumPolymarketConnect } from "@/features/wallet/components/premium-polymarket-connect";
import { ROUTES } from "@/shared/constants/routes";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { isMarketsExplorerNavActive } from "@/widgets/app-shell/lib/nav-config";

/** Primary destinations — live discovery is `/markets` (marketing entry is `/`). */
const PRIMARY_NAV = [
  { label: "Markets", href: ROUTES.marketsBrowse, explorer: true },
  { label: "Portfolio", href: ROUTES.portfolio },
] as const;

/** Items grouped under the user menu dropdown (right side). */
const USER_MENU = [
  { label: "Portfolio", href: ROUTES.portfolio, icon: LayoutDashboard },
  { label: "Wallet", href: ROUTES.wallet, icon: Wallet },
  { label: "Profile", href: ROUTES.profile, icon: User },
  { label: "Settings", href: ROUTES.settings, icon: Settings },
] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const showAdminNav = useShowAdminNavLink();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050508]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#050508]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-[3.75rem] sm:gap-5 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex shrink-0 flex-col leading-none transition hover:opacity-90"
          onClick={() => setOpen(false)}
        >
          <span className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
            Orakly
          </span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-1.5"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => {
            const active =
              "explorer" in item && item.explorer
                ? isMarketsExplorerNavActive(pathname)
                : isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[13px] font-medium transition",
                  active
                    ? "bg-white/[0.07] text-white ring-1 ring-cyan-400/25"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <PremiumPolymarketConnect className="order-last min-[420px]:order-none" />

          <Link
            href={ROUTES.marketCreate}
            className="hidden items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-2 text-[13px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:text-white md:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Link>

          {/* User menu */}
          <div className="relative hidden md:block" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[13px] font-medium ring-1 transition",
                menuOpen
                  ? "bg-white/[0.08] text-white ring-white/15"
                  : "bg-white/[0.04] text-zinc-300 ring-white/10 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Me</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="glass-panel-strong absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl p-1.5 shadow-2xl shadow-black/40"
              >
                {USER_MENU.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition",
                        active
                          ? "bg-cyan-500/10 text-cyan-100"
                          : "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="my-1 border-t border-white/[0.06]" />
                <Link
                  href={ROUTES.signIn}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
                {showAdminNav ? (
                  <Link
                    href={ROUTES.adminDashboard}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
                  >
                    Operator console
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <Link
            href={ROUTES.marketsTrending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/12 px-3 py-2 text-[13px] font-semibold text-cyan-100 ring-1 ring-cyan-400/28 transition hover:bg-cyan-500/18 sm:px-4 sm:py-2.5"
          >
            <span className="hidden sm:inline">Open hub</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>

          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/[0.04] hover:text-white lg:hidden"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="landing-mobile-nav"
        className={cn(
          "border-t border-white/[0.06] bg-[#050508]/95 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-3 sm:px-6"
          aria-label="Mobile primary"
        >
          {PRIMARY_NAV.map((item) => {
            const active =
              "explorer" in item && item.explorer
                ? isMarketsExplorerNavActive(pathname)
                : isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[14px] font-medium",
                  active
                    ? "bg-white/[0.06] text-white ring-1 ring-cyan-400/25"
                    : "text-zinc-300 hover:bg-white/[0.04]",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-white/[0.06] pt-3">
            <Link
              href={ROUTES.marketCreate}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2.5 text-[13px] font-semibold text-zinc-100 ring-1 ring-white/12 transition hover:bg-white/[0.1]"
              onClick={() => setOpen(false)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create market
            </Link>

            {USER_MENU.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[12.5px] text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.08]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}

            <Link
              href={ROUTES.signIn}
              onClick={() => setOpen(false)}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-zinc-400 ring-1 ring-white/10 hover:bg-white/[0.08]"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in / wallet
            </Link>
            {showAdminNav ? (
              <Link
                href={ROUTES.adminDashboard}
                onClick={() => setOpen(false)}
                className="col-span-2 rounded-lg px-3 py-2 text-center text-[11.5px] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
              >
                Operator console
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
