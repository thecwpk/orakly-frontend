"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.06]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-zinc-200">{title}</p>
        {description ? (
          <p className="max-w-sm text-[11.5px] text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
