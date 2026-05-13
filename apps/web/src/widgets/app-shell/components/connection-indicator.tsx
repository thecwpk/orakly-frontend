"use client";

import { motion } from "framer-motion";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  connected: "Realtime",
  connecting: "Connecting",
  disconnected: "Offline",
  error: "Reconnecting",
} as const;

const STATUS_TONE = {
  connected: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]",
  connecting: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
  disconnected: "bg-zinc-500",
  error: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]",
} as const;

export function ConnectionIndicator({ collapsed }: { collapsed: boolean }) {
  const { connectionStatus } = useSocketRegistry();
  const tone = STATUS_TONE[connectionStatus];
  const label = STATUS_LABEL[connectionStatus];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 ring-1 ring-white/[0.06]",
        collapsed && "justify-center",
      )}
      aria-live="polite"
      title={`Realtime: ${label}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {connectionStatus === "connected" ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-emerald-400/35"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <span className={cn("relative h-2 w-2 rounded-full", tone)} />
      </span>
      {!collapsed ? (
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </span>
      ) : null}
    </div>
  );
}
