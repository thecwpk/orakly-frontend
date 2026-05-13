"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TabShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300/90">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-balance text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12.5px] text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </motion.div>
  );
}

export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]",
        className,
      )}
    >
      {title || action ? (
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
          <div className="min-w-0">
            {title ? (
              <p className="text-[13px] font-semibold tracking-tight text-white">{title}</p>
            ) : null}
            {description ? (
              <p className="text-[10.5px] text-zinc-500">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
