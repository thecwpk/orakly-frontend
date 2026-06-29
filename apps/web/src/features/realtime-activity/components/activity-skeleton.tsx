import { memo } from "react";
import { cn } from "@/lib/utils";

function Row({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact ? "px-3 py-2" : "px-4 py-2.5",
      )}
    >
      <div className="h-4 w-9 rounded-md bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
      <div className="h-4 w-7 rounded-md bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
        <div className="h-2.5 w-1/2 rounded bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="ml-auto h-3 w-12 rounded bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
        <div className="ml-auto h-2 w-7 rounded bg-[var(--hub-bg-subtle)] skeleton-shimmer" />
      </div>
    </div>
  );
}

function ActivitySkeletonImpl({
  count = 6,
  compact,
}: {
  count?: number;
  compact?: boolean;
}) {
  return (
    <div className="divide-y divide-[var(--hub-border)]">
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} compact={compact} />
      ))}
    </div>
  );
}

export const ActivitySkeleton = memo(ActivitySkeletonImpl);
