"use client";

import {
  Activity,
  BadgeCheck,
  BarChart3,
  Brain,
  Briefcase,
  LayoutGrid,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Star,
  Swords,
  Trophy,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import { PrefetchLink } from "@/shared/ui";
import { useAccount } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { ROUTES } from "@/shared/constants/routes";
import { useIsAuthenticated } from "@/state/selectors/auth.selectors";
import { useAuthStore } from "@/state/stores/auth.store";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { cn } from "@/lib/utils";

const menuItem =
  "cursor-pointer rounded-lg px-3 py-2.5 text-[13px] font-normal leading-snug text-zinc-100 focus:bg-white/[0.07] focus:text-white";

const subMenuPanel =
  "max-h-[min(52vh,340px)] w-[min(calc(100vw-2rem),248px)] overflow-y-auto rounded-[10px] border border-white/[0.06] bg-[#16181f]/97 p-1.5 shadow-[0_20px_48px_-14px_rgba(0,0,0,0.88)] backdrop-blur-xl";

const categoryRow =
  "cursor-pointer rounded-md px-2 py-2 text-[12px] font-normal text-zinc-100 focus:bg-white/[0.06]";

const sectionLabel =
  "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500";

function marketsCategoryHref(_slug: string) {
  return ROUTES.marketsBrowse;
}

/**
 * Hamburger menu — trading utilities and account destinations (Polymarket-style).
 */
export function UserMenu() {
  const { address, status } = useAccount();
  const connected = status === "connected" && Boolean(address);
  const tradingReady = useIsAuthenticated();
  const tradingUserId = useAuthStore((s) => s.tradingUserId);
  const showAdminNav = useShowAdminNavLink();

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
        <DropdownMenuLabel className={sectionLabel}>Trading</DropdownMenuLabel>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.marketsBrowse}>
            <LayoutGrid className="mr-2 size-4 text-zinc-500" aria-hidden />
            Markets
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.marketsCommunity}>
            <Users className="mr-2 size-4 text-zinc-500" aria-hidden />
            Community
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.watchlist}>
            <Star className="mr-2 size-4 text-zinc-500" aria-hidden />
            Watchlist
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.marketCreate}>
            <Sparkles className="mr-2 size-4 text-yes/90" aria-hidden />
            Create market
          </PrefetchLink>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={menuItem}>Categories</DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={10} alignOffset={0} className={subMenuPanel}>
            {MARKET_CATEGORIES.map((cat) => (
              <DropdownMenuItem key={cat.slug} asChild className={categoryRow}>
                <PrefetchLink href={marketsCategoryHref(cat.slug)}>{cat.name}</PrefetchLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem asChild className={categoryRow}>
              <PrefetchLink href={ROUTES.markets}>Full explorer</PrefetchLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={categoryRow}>
              <PrefetchLink href={ROUTES.marketsTrending}>Trending tape</PrefetchLink>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />

        <DropdownMenuLabel className={sectionLabel}>Discover</DropdownMenuLabel>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.attention}>
            <Brain className="mr-2 size-4 text-zinc-500" aria-hidden />
            Attention
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.narrativeWars}>
            <Swords className="mr-2 size-4 text-zinc-500" aria-hidden />
            Narrative Wars
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.leaderboard}>
            <Trophy className="mr-2 size-4 text-zinc-500" aria-hidden />
            Leaderboard
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.analytics}>
            <BarChart3 className="mr-2 size-4 text-zinc-500" aria-hidden />
            Analytics
          </PrefetchLink>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />

        <DropdownMenuLabel className={sectionLabel}>Account</DropdownMenuLabel>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={tradingUserId ? ROUTES.profile : ROUTES.wallet}>
            <UserIcon className="mr-2 size-4 text-zinc-500" aria-hidden />
            Profile
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.portfolio}>
            <Briefcase className="mr-2 size-4 text-zinc-500" aria-hidden />
            Portfolio
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.wallet}>
            <Wallet className="mr-2 size-4 text-zinc-500" aria-hidden />
            Wallet
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.activity}>
            <Activity className="mr-2 size-4 text-zinc-500" aria-hidden />
            Activity
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={menuItem}>
          <PrefetchLink href={ROUTES.settings}>
            <Settings className="mr-2 size-4 text-zinc-500" aria-hidden />
            Settings
          </PrefetchLink>
        </DropdownMenuItem>

        {showAdminNav ? (
          <>
            <DropdownMenuSeparator className="my-2 bg-white/[0.07]" />
            <DropdownMenuItem asChild className={menuItem}>
              <PrefetchLink href={ROUTES.adminDashboard}>
                <Shield className="mr-2 size-4 text-zinc-500" aria-hidden />
                Operator console
              </PrefetchLink>
            </DropdownMenuItem>
          </>
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
