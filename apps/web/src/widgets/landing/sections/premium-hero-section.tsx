"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_FOR_DARK_NAV, BRAND_LOGO_FOR_LIGHT_NAV } from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";
import { LANDING_IMAGES } from "../lib/landing-image-paths";

const NEW_TAB = { target: "_blank" as const, rel: "noopener noreferrer" as const };

const easeOut = [0.22, 1, 0.36, 1] as const;

const headline = "The Prediction Market for Crypto Attention";

const HERO_STATS = [
  { label: "Market Updates", value: "Real-Time" },
  { label: "Trade Format", value: "YES / NO" },
  { label: "Settlement", value: "On-Chain" },
  { label: "Infrastructure", value: "Transparent" },
] as const;

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: easeOut },
  },
};

const headlineBlock = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.038, delayChildren: 0.1 },
  },
};

const wordReveal = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeOut },
  },
};

const wordRevealReduced = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: easeOut } },
};

type FloatingShapeProps = {
  className?: string;
  delay?: number;
  reduceMotion: boolean | null;
};

function FloatingShape({ className, delay = 0, reduceMotion }: FloatingShapeProps) {
  if (reduceMotion) {
    return (
      <div
        className={cn("pointer-events-none absolute rounded-md border bg-[var(--bg-3)]/40", className)}
        style={{ borderColor: "var(--border-soft)" }}
        aria-hidden
      />
    );
  }
  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-md border bg-gradient-to-br from-white/[0.04] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
      style={{ borderColor: "var(--border-soft)" }}
      animate={{
        y: [0, -14, 0],
        rotate: [0, 1.5, 0],
        opacity: [0.35, 0.55, 0.4],
      }}
      transition={{
        duration: 7 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function HeroAtmosphere({
  scrollSlow,
  scrollMid,
  reduceMotion,
}: {
  scrollSlow: MotionValue<number>;
  scrollMid: MotionValue<number>;
  reduceMotion: boolean | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 92% 42%, color-mix(in srgb, var(--accent-dim) 35%, transparent) 0%, transparent 52%),
            radial-gradient(ellipse 70% 50% at 88% 58%, rgba(139, 80, 80, 0.08) 0%, transparent 48%),
            radial-gradient(ellipse 85% 65% at 18% 22%, color-mix(in srgb, var(--bg-2) 55%, transparent) 0%, transparent 50%),
            linear-gradient(165deg, var(--bg-0) 0%, var(--bg-1) 45%, color-mix(in srgb, var(--bg-1) 92%, black) 100%)
          `,
        }}
      />

      <motion.div
        className="absolute inset-0 opacity-[0.28] sm:opacity-[0.32] lg:opacity-[0.36]"
        style={reduceMotion ? undefined : { y: scrollSlow }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(108deg, hsl(222 44% 5.5% / 0.96) 0%, hsl(222 44% 5.5% / 0.82) 20%, hsl(222 44% 5.5% / 0.48) 40%, hsl(222 44% 5.5% / 0.14) 56%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(125% 115% at 96% 48%, black 0%, black 32%, rgba(0,0,0,0.65) 52%, rgba(0,0,0,0.2) 72%, transparent 88%)",
            WebkitMaskImage:
              "radial-gradient(125% 115% at 96% 48%, black 0%, black 32%, rgba(0,0,0,0.65) 52%, rgba(0,0,0,0.2) 72%, transparent 88%)",
          }}
        >
          <motion.div
            className="absolute -right-[6%] top-0 h-full w-[92%] sm:w-[82%] lg:-right-[2%] lg:w-[68%]"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.03, 1],
                    x: ["0%", "-0.6%", "0%"],
                  }
            }
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={LANDING_IMAGES.hero}
              alt=""
              fill
              priority
              className="object-cover object-[72%_center] saturate-[0.92] lg:object-[62%_center]"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-cyan-950/10 to-[hsl(222_48%_8%/0.45)] mix-blend-soft-light" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222_48%_4%/0.55)] via-transparent to-transparent" />
          </motion.div>
        </div>
      </motion.div>

      {!reduceMotion ? (
        <>
          <motion.div
            className="absolute -left-[12%] top-[6%] h-[min(62vmin,560px)] w-[min(62vmin,560px)] rounded-full bg-teal-400/14 blur-[130px]"
            animate={{ opacity: [0.22, 0.38, 0.26], scale: [1, 1.05, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-[8%] bottom-[8%] h-[min(52vmin,480px)] w-[min(52vmin,480px)] rounded-full bg-cyan-300/11 blur-[110px]"
            animate={{ opacity: [0.18, 0.34, 0.22] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
          <motion.div
            className="absolute left-[40%] top-[55%] h-[min(36vmin,320px)] w-[min(36vmin,320px)] -translate-x-1/2 rounded-full bg-zinc-600/10 blur-[90px]"
            style={reduceMotion ? undefined : { y: scrollMid }}
            animate={{ opacity: [0.1, 0.16, 0.12] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </>
      ) : (
        <div className="absolute -left-[12%] top-[6%] h-[min(58vmin,520px)] w-[min(58vmin,520px)] rounded-full bg-teal-400/10 blur-[120px]" />
      )}

      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.055) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.055) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 95% 85% at 28% 38%, black 0%, rgba(0,0,0,0.5) 55%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 95% 85% at 28% 38%, black 0%, rgba(0,0,0,0.5) 55%, transparent 78%)",
        }}
      />

      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.042] sm:opacity-[0.055]"
        style={{ backgroundImage: NOISE_DATA_URI }}
      />

      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 100px rgba(0,0,0,0.42), inset 0 -100px 140px rgba(0,0,0,0.38), inset 0 0 240px rgba(0,0,0,0.18)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-0)] via-transparent to-transparent" />
    </div>
  );
}

function HeroAbstractField({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative hidden h-full min-h-[280px] lg:block" aria-hidden>
      <FloatingShape reduceMotion={reduceMotion} className="right-[6%] top-[12%] h-24 w-24 rotate-[-8deg] sm:h-28 sm:w-28" delay={0} />
      <FloatingShape reduceMotion={reduceMotion} className="right-[22%] top-[38%] h-[4.5rem] w-[4.5rem] rotate-[12deg]" delay={0.8} />
      <FloatingShape reduceMotion={reduceMotion} className="right-[10%] bottom-[18%] h-20 w-20 rotate-[6deg]" delay={1.4} />
      <FloatingShape reduceMotion={reduceMotion} className="right-[34%] bottom-[32%] h-12 w-12 rotate-[-14deg]" delay={2} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,color-mix(in_srgb,var(--accent-soft)_12%,transparent),transparent_55%)]" />
    </div>
  );
}

export type PremiumHeroSectionProps = {
  navbar: ReactNode;
};

export function PremiumHeroSection({ navbar }: PremiumHeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const scrollSlow = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scrollMid = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const words = headline.split(" ");

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative isolate my-0 flex min-h-svh flex-col overflow-hidden bg-gradient-to-b from-[var(--bg-0)] to-[var(--bg-1)] text-[var(--text-secondary)] antialiased"
    >
      <HeroAtmosphere scrollSlow={scrollSlow} scrollMid={scrollMid} reduceMotion={reduceMotion} />

      <div className="relative shrink-0">{navbar}</div>

      <motion.div
        className="relative z-10 flex w-full max-w-none flex-1 flex-col px-[var(--space-4)] pb-[var(--space-6)] pt-[var(--space-1)] sm:px-[var(--space-6)] sm:pb-[var(--space-6)] sm:pt-[var(--space-2)] lg:px-[var(--space-7)] lg:pb-[var(--space-7)] lg:pt-[var(--space-3)]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex min-h-0 flex-1 flex-col justify-center lg:min-h-[calc(100svh-8rem)]">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-12">
            <div className="relative max-w-xl lg:max-w-none">
              <div
                className="pointer-events-none absolute -left-16 top-[6%] z-0 h-[min(100%,480px)] w-[min(110%,380px)] -translate-x-[14%] rounded-full blur-3xl sm:-left-20 lg:top-[10%]"
                style={{
                  background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent-soft) 14%, transparent), transparent 68%)",
                }}
                aria-hidden
              />
              <div className="relative z-10">
                <motion.div variants={fadeUp} className="flex items-center gap-3.5 sm:gap-[var(--space-4)]">
                  <div
                    className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[var(--bg-3)]/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:size-14 sm:p-2.5"
                    style={{ borderWidth: 1, borderColor: "var(--border-soft)", borderStyle: "solid" }}
                  >
                    <Image
                      src={BRAND_LOGO_FOR_LIGHT_NAV}
                      alt="Orakly"
                      width={44}
                      height={44}
                      className="h-full w-full object-contain dark:hidden"
                      priority
                    />
                    <Image
                      src={BRAND_LOGO_FOR_DARK_NAV}
                      alt="Orakly"
                      width={44}
                      height={44}
                      className="hidden h-full w-full object-contain dark:block"
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.34em] text-[var(--text-muted)] sm:text-[11px]">
                      Orakly Market
                    </p>
                    <p className="mt-0.5 font-semibold tracking-[-0.03em]">
                      <span className="text-2xl text-[var(--text-primary)] sm:text-[1.9rem]">Orakly</span>
                      <span className="mx-2 text-2xl font-extralight text-[var(--text-muted)]/50 sm:text-[1.9rem]" aria-hidden>
                        /
                      </span>
                      <span className="text-2xl text-[var(--accent-soft)] sm:text-[1.9rem]">Market</span>
                    </p>
                  </div>
                </motion.div>

                <motion.h1
                  variants={headlineBlock}
                  className="mt-6 max-w-4xl text-pretty text-3xl font-medium leading-[1.1] tracking-[-0.04em] text-[var(--text-primary)] sm:mt-8 sm:text-4xl sm:tracking-[-0.042em] lg:mt-10 lg:text-[2.5rem] lg:leading-[1.06] xl:text-[2.85rem]"
                >
                  {words.map((w, i) => (
                    <motion.span
                      key={`${w}-${i}`}
                      variants={reduceMotion ? wordRevealReduced : wordReveal}
                      className="inline-block pr-[0.18em] last:pr-0"
                    >
                      {w}
                    </motion.span>
                  ))}
                </motion.h1>

                <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-[15px] font-medium leading-relaxed text-[var(--text-primary)] sm:text-[16px]">
                  Trade crypto narratives with transparent, on-chain odds.
                </motion.p>

                <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-pretty text-[14px] leading-relaxed text-[var(--text-secondary)] sm:text-[15px] sm:leading-[1.75]">
                  Orakly converts attention, conviction, and market sentiment into tradable YES and NO positions — enabling
                  a faster, clearer, and more transparent way to participate in crypto narratives.
                </motion.p>

                <motion.p variants={fadeUp} className="mt-3 text-[13px] font-medium text-[var(--accent-soft)] sm:text-[14px]">
                  Built for the next generation of crypto traders.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-[var(--space-3)] sm:flex-nowrap sm:gap-[var(--space-4)]">
                  <motion.span
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  >
                    <Link
                      href={ROUTES.dapp}
                      className={cn(
                        "group relative inline-flex items-center gap-2 overflow-hidden rounded-md px-6 py-3 text-[13px] font-semibold",
                        "bg-[var(--accent-strong)] text-[var(--bg-0)]",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                        "transition duration-200 hover:brightness-110",
                      )}
                      {...NEW_TAB}
                    >
                      Launch App
                      <ArrowRight className="size-4 opacity-80 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </motion.span>
                  <motion.span
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  >
                    <Link
                      href={ROUTES.discover}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md px-6 py-3 text-[13px] font-medium text-[var(--text-primary)]",
                        "bg-[var(--bg-3)]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md",
                        "transition duration-200 hover:bg-[var(--bg-3)]",
                      )}
                      style={{ borderWidth: 1, borderColor: "var(--border-soft)", borderStyle: "solid" }}
                      {...NEW_TAB}
                    >
                      Explore Markets
                    </Link>
                  </motion.span>
                  <motion.a
                    href="#early-access"
                    whileHover={reduceMotion ? undefined : { x: 3 }}
                    className="text-sm font-medium text-[var(--accent-strong)] underline-offset-[6px] transition hover:text-[var(--accent-soft)] hover:underline"
                    {...NEW_TAB}
                  >
                    Join Early Access
                  </motion.a>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-10 border-t pt-6"
                  style={{ borderColor: "var(--border-soft)" }}
                  aria-label="Transparency highlights"
                >
                  <p id="hero-subtext-heading" className="sr-only">
                    Hero subtext
                  </p>
                  <ul className="mt-0 space-y-2 text-[13px] leading-relaxed text-[var(--text-secondary)] sm:text-[14px]">
                    <li>No hidden spread mechanics.</li>
                    <li>No opaque settlement logic.</li>
                    <li className="text-[var(--text-primary)]">
                      Just transparent, real-time markets designed for crypto conviction.
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>

            <HeroAbstractField reduceMotion={reduceMotion} />
          </div>
        </div>
      </motion.div>

      <div
        className="relative z-10 mt-auto border-t border-b bg-[var(--bg-2)] backdrop-blur-sm"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <p className="sr-only">Key product facts</p>
        <div className="grid grid-cols-2 divide-x divide-y divide-[color:var(--border-soft)] sm:grid-cols-4 sm:divide-y-0">
          {HERO_STATS.map((row) => (
            <div
              key={row.label}
              className="px-[var(--space-4)] py-[var(--space-3)] font-mono sm:px-[var(--space-6)] sm:py-[var(--space-4)] lg:px-[var(--space-7)]"
            >
              <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{row.label}</p>
              <p className="mt-1 text-[13px] font-medium text-[var(--text-primary)] sm:text-[14px]">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
