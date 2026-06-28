"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { adminUi } from "../lib/admin-ui-classes";

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
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--hub-border)] pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--hub-primary-bright)]">
            {eyebrow}
          </p>
          <h1 className="hub-section-title mt-1 text-balance sm:text-[22px]">{title}</h1>
          {description ? (
            <p className="hub-section-sub mt-1 text-[12.5px]">{description}</p>
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
    <section className={cn(adminUi.card, className)}>
      {title || action ? (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-2.5 sm:px-5">
          <div className="min-w-0">
            {title ? (
              <p className="text-[13px] font-semibold tracking-tight text-[var(--hub-fg)]">
                {title}
              </p>
            ) : null}
            {description ? (
              <p className="text-[10.5px] text-[var(--hub-muted)]">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
