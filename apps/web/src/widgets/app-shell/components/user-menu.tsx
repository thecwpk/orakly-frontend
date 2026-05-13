"use client";

import {
  Activity,
  BadgeCheck,
  Check,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Sparkles,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PrefetchLink } from "@/shared/ui";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { ROUTES } from "@/shared/constants/routes";
import { useIsAuthenticated } from "@/state/selectors/auth.selectors";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { cn } from "@/lib/utils";

const menuItem =
  "cursor-pointer rounded-lg px-3 py-2.5 text-[13px] font-normal leading-snug text-zinc-100 focus:bg-white/[0.07] focus:text-white data-[variant=destructive]:text-rose-400";

const subMenuPanel =
  "max-h-[min(52vh,340px)] w-[min(calc(100vw-2rem),248px)] overflow-y-auto rounded-[10px] border border-white/[0.06] bg-[#16181f]/97 p-1.5 shadow-[0_20px_48px_-14px_rgba(0,0,0,0.88)] backdrop-blur-xl";

const categoryRow =
  "cursor-pointer rounded-md px-2 py-2 text-[12px] font-normal text-zinc-100 focus:bg-white/[0.06]";

/**
 * Hamburger “more” menu — Polymarket-style sections (utility · legal · language · account).
 */
export function UserMenu() {
  const { address, status } = useAccount();
  const connected = status === "connected" && Boolean(address);
  const tradingReady = useIsAuthenticated();
  const showAdminNav = useShowAdminNavLink();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<"en" | "id">("en");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("orakly-locale");
      if (saved === "id" || saved === "en") setLocale(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("orakly-locale", locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More menu"
          aria-haspopup="menu"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-zinc-100 transition hover:border-white/[0.12] hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/35"
        >
          <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          "min-w-[min(calc(100vw-1.5rem),272px)] rounded-[10px] border border-white/[0.06] bg-[#16181f]/97 p-2 shadow-[0_24px_56px_-14px_rgba(0,0,0,0.92)] backdrop-blur-xl",
        )}
      >
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.leaderboard}>
            Leaderboard
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.portfolio}>
            Rewards
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.welcome}>
            APIs
          </PrefetchLink>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={menuItem}>Categories</DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={10} alignOffset={0} className={subMenuPanel}>
            {MARKET_CATEGORIES.map((cat) => (
              <DropdownMenuItem key={cat.slug} asChild className={categoryRow}>
                <PrefetchLink href={`${ROUTES.markets}?cat=${encodeURIComponent(cat.slug)}`}>
                  {cat.name}
                </PrefetchLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem asChild className={categoryRow}>
              <PrefetchLink href={ROUTES.marketsBrowse}>
                Full explorer
              </PrefetchLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={categoryRow}>
              <PrefetchLink href={ROUTES.marketsTrending}>
                Trending tape
              </PrefetchLink>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className={cn(menuItem, "gap-2")}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <span className="flex h-4 w-5 shrink-0 justify-center text-yes" aria-hidden>
            {isDark ? <Check className="size-4" strokeWidth={2.5} /> : null}
          </span>
          Dark mode
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />

        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.leaderboard}>
            Accuracy
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.welcome}>
            Documentation
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <Link href={`${ROUTES.welcome}#community`} prefetch={false}>
            Help Center
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <Link href={`${ROUTES.welcome}#footer`} prefetch={false}>
            Terms of Use
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn(menuItem, "pr-2")}>Bahasa</DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={8}
            className="rounded-[10px] border border-white/[0.06] bg-[#16181f]/97 p-1.5 shadow-[0_20px_48px_-14px_rgba(0,0,0,0.88)] backdrop-blur-xl"
          >
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(v) => setLocale(v === "id" ? "id" : "en")}
            >
              <DropdownMenuRadioItem value="en" className={categoryRow}>
                English
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="id" className={categoryRow}>
                Bahasa Indonesia
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />

        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.profile}>
            <UserIcon className="mr-2 size-4 text-zinc-500" aria-hidden />
            Profile
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.userDashboard}>
            <LayoutDashboard className="mr-2 size-4 text-zinc-500" aria-hidden />
            Dashboard
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.activity}>
            <Activity className="mr-2 size-4 text-zinc-500" aria-hidden />
            Activity
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.wallet}>
            <Wallet className="mr-2 size-4 text-zinc-500" aria-hidden />
            Wallet
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.settings}>
            <Settings className="mr-2 size-4 text-zinc-500" aria-hidden />
            Settings
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.marketCreate}>
            <Sparkles className="mr-2 size-4 text-yes/90" aria-hidden />
            Create market
          </PrefetchLink>
        </DropdownMenuItem>

        {showAdminNav ? (
          <DropdownMenuItem asChild className={menuItem}>
            <PrefetchLink href={ROUTES.adminDashboard}>
              <Shield className="mr-2 size-4 text-zinc-500" aria-hidden />
              Operator console
            </PrefetchLink>
          </DropdownMenuItem>
        ) : null}

        {connected && !tradingReady ? (
          <>
            <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />
            <DropdownMenuItem asChild className={menuItem}>
              <PrefetchLink href={ROUTES.wallet}>
                <BadgeCheck className="mr-2 size-4 text-yes" aria-hidden />
                Verify wallet for trading
              </PrefetchLink>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
