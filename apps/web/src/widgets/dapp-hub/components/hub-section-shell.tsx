"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HubSectionShell({
  id,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("hub-section", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="hub-section-title">{title}</h2>
          {subtitle ? <p className="hub-section-sub mt-1">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
