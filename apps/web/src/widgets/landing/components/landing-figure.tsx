"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"] as const;

type LandingFigureProps = {
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  aspectClass?: string;
  variant?: "card" | "cover";
} & (
  | {
      /** Exact path under `public/`, e.g. `/pictures/photo.jpg` — no extension fallback. */
      src: string;
      basePath?: never;
    }
  | {
      /** Base path without extension, e.g. `/landing/hero` — tries .webp, .png, .jpg, .jpeg */
      basePath: string;
      src?: never;
    }
);

export function LandingFigure({
  src: directSrc,
  basePath,
  alt,
  className,
  imgClassName,
  priority,
  aspectClass = "aspect-[4/3]",
  variant = "card",
}: LandingFigureProps) {
  const isDirect = directSrc !== undefined;
  const [extIndex, setExtIndex] = useState(0);
  const [givenUp, setGivenUp] = useState(false);

  const src = isDirect ? directSrc : `${basePath}${EXTENSIONS[extIndex]}`;

  const tryNext = useCallback(() => {
    if (isDirect) {
      setGivenUp(true);
      return;
    }
    setExtIndex((i) => {
      if (i + 1 < EXTENSIONS.length) return i + 1;
      setGivenUp(true);
      return i;
    });
  }, [isDirect]);

  const fallback = (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-gradient-to-br from-yes/[0.12] via-card to-primary/[0.14]",
        "ring-1 ring-inset ring-white/[0.06]",
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,var(--yes)_22%,transparent),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:32px_32px] opacity-60" />
    </div>
  );

  if (variant === "cover") {
    if (givenUp) {
      return (
        <div className={cn("relative h-full w-full overflow-hidden", className)}>
          {fallback}
        </div>
      );
    }
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className={cn("object-cover", imgClassName)}
          sizes="(max-width: 1024px) 100vw, 40vw"
          onError={tryNext}
        />
      </div>
    );
  }

  if (givenUp) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-yes/[0.12] via-card to-primary/[0.14]",
          "ring-1 ring-inset ring-white/[0.06]",
          aspectClass,
          className,
        )}
        aria-hidden
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border shadow-[0_24px_64px_-28px_rgba(0,0,0,0.75)]", aspectClass, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={cn("object-cover", imgClassName)}
        sizes="(max-width: 1024px) 100vw, 50vw"
        onError={tryNext}
      />
    </div>
  );
}
