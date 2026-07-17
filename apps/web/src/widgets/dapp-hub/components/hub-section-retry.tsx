"use client";

export function HubSectionRetry({
  message = "Unable to load this section.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--hub-muted)]">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-[var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[var(--hub-fg)] hover:border-[var(--hub-success)] hover:text-[var(--hub-success)]"
      >
        Retry
      </button>
    </div>
  );
}
