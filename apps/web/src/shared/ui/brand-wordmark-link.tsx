"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { BRAND_LOGO_NAV } from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";

export type BrandWordmarkTone = "onDark" | "onLight" | "theme";

export type BrandWordmarkLinkProps = {
  href?: string;
  tone?: BrandWordmarkTone;
  /** Show “Orakly Market” beside the mark. */
  showTitle?: boolean;
  /** Nav lockup — glass frame + blend so dark PNG sits on blue chrome. */
  variant?: "default" | "nav";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  onClick?: () => void;
};

/**
 * Home link + Orakly mark + optional title.
 */
export function BrandWordmarkLink({
  href = ROUTES.home,
  showTitle = false,
  variant = "default",
  className,
  imgClassName,
  priority = false,
  onClick,
}: BrandWordmarkLinkProps) {
  const [failed, setFailed] = useState(false);
  const nav = variant === "nav";

  if (failed) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn("flex shrink-0 items-center gap-2.5", className)}
        aria-label="Orakly Market home"
      >
        <BrandTitleFallback nav={nav} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex shrink-0 items-center transition duration-200 hover:opacity-[0.98]",
        nav ? "gap-3 sm:gap-3.5" : "gap-2.5 sm:gap-3",
        className,
      )}
      aria-label="Orakly Market home"
    >
      <span
        className={cn(
          nav &&
            "marketing-brand-mark relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-11",
        )}
      >
        {nav ? (
          <span
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-sky-400/20 via-transparent to-violet-500/15 opacity-80"
            aria-hidden
          />
        ) : null}
        <Image
          src={BRAND_LOGO_NAV}
          alt=""
          width={nav ? 88 : 200}
          height={nav ? 88 : 52}
          unoptimized
          priority={priority}
          className={cn(
            nav
              ? "relative z-[1] size-[1.65rem] object-contain object-center mix-blend-lighten sm:size-[1.85rem]"
              : showTitle
                ? "h-8 w-auto max-w-[88px] object-contain object-left sm:h-9 sm:max-w-[100px]"
                : "h-7 w-auto max-w-[min(52vw,200px)] object-contain object-left sm:h-8 sm:max-w-[220px]",
            imgClassName,
          )}
          onError={() => setFailed(true)}
        />
      </span>
      {showTitle ? <BrandTitle nav={nav} /> : null}
    </Link>
  );
}

function BrandTitle({ nav }: { nav: boolean }) {
  if (nav) {
    return (
      <span className="flex min-w-0 flex-col justify-center leading-[1.15]">
        <span className="font-display text-[1.05rem] font-bold tracking-[-0.03em] text-white sm:text-lg">
          Orakly
          <span className="font-semibold text-sky-200/90"> Market</span>
        </span>
        <span className="mt-0.5 hidden font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-sky-400/55 sm:block">
          On-chain predictions
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-col justify-center leading-none">
      <span className="font-display text-[15px] font-bold tracking-[-0.02em] sm:text-base">
        <span className="bg-gradient-to-r from-slate-100 via-white to-sky-200 bg-clip-text text-transparent">
          Orakly
        </span>
      </span>
      <span className="mt-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-300/75 transition group-hover:text-sky-200/90 sm:text-[10px]">
        Market
      </span>
    </span>
  );
}

function BrandTitleFallback({ nav }: { nav: boolean }) {
  if (nav) {
    return (
      <span className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
        Orakly <span className="text-sky-300/90">Market</span>
      </span>
    );
  }
  return (
    <span className="flex flex-col leading-none">
      <span className="font-display text-[15px] font-bold text-foreground">Orakly</span>
      <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-sky-300/80">Market</span>
    </span>
  );
}
