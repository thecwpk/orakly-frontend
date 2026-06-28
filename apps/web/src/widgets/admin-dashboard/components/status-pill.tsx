import { cn } from "@/lib/utils";

const TONE: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  OPEN: {
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
    dot: "bg-emerald-400",
  },
  DRAFT: {
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/10",
    text: "text-amber-200",
    dot: "bg-amber-400",
  },
  PAUSED: {
    ring: "ring-rose-400/30",
    bg: "bg-rose-500/10",
    text: "text-rose-200",
    dot: "bg-rose-400",
  },
  CLOSED: {
    ring: "ring-[var(--hub-border-strong)]",
    bg: "bg-[var(--hub-primary-soft)]",
    text: "text-[var(--hub-primary-bright)]",
    dot: "bg-[var(--hub-primary)]",
  },
  RESOLVED: {
    ring: "ring-cyan-400/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-200",
    dot: "bg-cyan-400",
  },
  CANCELED: {
    ring: "ring-zinc-400/30",
    bg: "bg-zinc-500/10",
    text: "text-[var(--hub-muted)]",
    dot: "bg-zinc-400",
  },
};

const FALLBACK = {
  ring: "ring-zinc-400/30",
  bg: "bg-zinc-500/10",
  text: "text-[var(--hub-muted)]",
  dot: "bg-zinc-400",
} as const;

export function StatusPill({ status }: { status: string }) {
  const t = TONE[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ring-1",
        t.bg,
        t.text,
        t.ring,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {status}
    </span>
  );
}
