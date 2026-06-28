/** Shared hub-aligned class strings for the operator console. */
export const adminUi = {
  card: "hub-card overflow-hidden",
  btnGhost:
    "inline-flex items-center gap-1.5 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-50",
  btnPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--hub-primary)] px-3 py-1.5 text-[12px] font-bold text-white transition hover:brightness-110 disabled:opacity-40",
  input:
    "w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2 text-[12.5px] text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50",
  inputSm:
    "w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-8 pr-7 text-[12.5px] text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50",
  segmentWrap:
    "flex items-center gap-1 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] p-1",
  segmentActive: "bg-[var(--hub-primary-soft)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]",
  segmentIdle: "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
  tableHead:
    "bg-[var(--hub-bg-subtle)]/95 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--hub-muted)] backdrop-blur",
  tableRow: "divide-y divide-[var(--hub-border)] text-[var(--hub-muted)]",
  skeleton: "skeleton-shimmer ring-1 ring-[var(--hub-border)]",
  iconBtn:
    "inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)]",
} as const;
