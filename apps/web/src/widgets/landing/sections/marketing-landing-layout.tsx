"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import { landingShell } from "./marketing-landing-rail";

type LandingShellProps = {
  children: ReactNode;
  className?: string;
};

/** Single max-width + horizontal padding — use inside full-bleed `<section>`. */
export function LandingShell({ children, className }: LandingShellProps) {
  return <div className={cn(landingShell, className)}>{children}</div>;
}

const reveal = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Subtle scroll reveal; no-op when user prefers reduced motion. */
export function LandingReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-48px 0px" }}
    >
      {children}
    </motion.div>
  );
}
