"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  BRAND_LOGO_FOR_DARK_NAV,
  BRAND_LOGO_FOR_LIGHT_NAV,
} from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

export type BrandWordmarkTone = "onDark" | "onLight" | "theme";

export type BrandWordmarkLinkProps = {
  href?: string;
  /** `onDark` / `onLight` fixed; `theme` follows next-themes (default topbar behavior). */
  tone: BrandWordmarkTone;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  onClick?: () => void;
};

/**
 * Home link + Orakly wordmark image. Falls back to text if raster fails to load.
 */
export function BrandWordmarkLink({
  href = ROUTES.home,
  tone,
  className,
  imgClassName,
  priority = false,
  onClick,
}: BrandWordmarkLinkProps) {
  const { resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const src = useMemo(() => {
    if (tone === "onDark") return BRAND_LOGO_FOR_DARK_NAV;
    if (tone === "onLight") return BRAND_LOGO_FOR_LIGHT_NAV;
    if (!themeReady || resolvedTheme !== "light") return BRAND_LOGO_FOR_DARK_NAV;
    return BRAND_LOGO_FOR_LIGHT_NAV;
  }, [tone, themeReady, resolvedTheme]);

  const fallbackTextClass =
    tone === "onDark"
      ? "text-white"
      : tone === "onLight"
        ? "text-zinc-950"
        : !themeReady || resolvedTheme !== "light"
          ? "text-white"
          : "text-zinc-950";

  if (failed) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn("flex shrink-0 items-center font-semibold tracking-tight", className)}
        aria-label="Orakly Market home"
      >
        <span className={cn("text-[15px] sm:text-base", fallbackTextClass)}>Orakly</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("flex shrink-0 items-center transition hover:opacity-90", className)}
      aria-label="Orakly Market home"
    >
      <Image
        key={src}
        src={src}
        alt="Orakly Market"
        width={200}
        height={44}
        priority={priority}
        className={cn(
          "h-7 w-auto max-w-[min(52vw,200px)] object-contain object-left sm:h-8 sm:max-w-[220px]",
          imgClassName,
        )}
        onError={() => setFailed(true)}
      />
    </Link>
  );
}
