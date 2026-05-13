"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-[5.5rem] sm:scroll-mt-[6rem]",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-xl text-[12px] leading-snug text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        {action ?
          <div className="shrink-0 sm:pt-0.5">{action}</div>
        : null}
      </div>
      {children}
    </section>
  );
}
