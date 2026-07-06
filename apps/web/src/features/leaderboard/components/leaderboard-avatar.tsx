"use client";

import { cn } from "@/lib/utils";

export function LeaderboardAvatar({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const seed = address.replace(/^0x/i, "").slice(0, 4).toUpperCase() || "00";
  const hue1 = (Number.parseInt(seed[0] ?? "0", 16) * 22) % 360;
  const hue2 = (hue1 + 120) % 360;

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold uppercase text-white ring-1 ring-white/15",
        className,
      )}
      style={{
        background: `conic-gradient(from 90deg, hsl(${hue1} 90% 60% / 0.85), hsl(${hue2} 90% 60% / 0.85), hsl(${hue1} 90% 60% / 0.85))`,
      }}
      aria-hidden
    >
      <span className="rounded-[5px] bg-[#06060a]/60 px-1 py-0.5">{seed}</span>
    </span>
  );
}
