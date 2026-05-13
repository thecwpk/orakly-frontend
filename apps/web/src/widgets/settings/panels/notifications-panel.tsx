"use client";

import { useState } from "react";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
} from "../components/settings-panel";

type Channel = "email" | "inApp" | "desktop";
type Topic = "fills" | "settles" | "mentions" | "newsletter" | "alerts";

const TOPICS: { id: Topic; label: string; hint: string }[] = [
  { id: "fills", label: "Fills", hint: "Every executed trade." },
  { id: "settles", label: "Settlements", hint: "Markets you're in resolving." },
  { id: "mentions", label: "Mentions", hint: "Comments tagging you." },
  { id: "alerts", label: "Price / odds alerts", hint: "User-configured rules." },
  { id: "newsletter", label: "Weekly digest", hint: "Curated edge from the engine." },
];

export function NotificationsSettingsPanel() {
  const [matrix, setMatrix] = useState<Record<Topic, Record<Channel, boolean>>>({
    fills: { email: false, inApp: true, desktop: true },
    settles: { email: true, inApp: true, desktop: false },
    mentions: { email: true, inApp: true, desktop: false },
    alerts: { email: false, inApp: true, desktop: true },
    newsletter: { email: true, inApp: false, desktop: false },
  });

  const toggle = (topic: Topic, channel: Channel) => {
    setMatrix((m) => ({
      ...m,
      [topic]: { ...m[topic], [channel]: !m[topic][channel] },
    }));
  };

  return (
    <SettingsPanel
      title="Notifications"
      description="Pick where each event should land."
    >
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-black/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2 text-center">In-app</th>
              <th className="px-3 py-2 text-center">Email</th>
              <th className="px-3 py-2 text-center">Desktop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {TOPICS.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2.5">
                  <p className="text-[12.5px] text-zinc-100">{t.label}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{t.hint}</p>
                </td>
                {(["inApp", "email", "desktop"] as Channel[]).map((c) => (
                  <td key={c} className="px-3 py-2.5 text-center">
                    <div className="inline-flex">
                      <SettingsToggle
                        checked={matrix[t.id][c]}
                        onChange={() => toggle(t.id, c)}
                        label={`${t.label} via ${c}`}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SettingsRow
        label="Quiet hours"
        hint="Suppress non-critical pushes during these local hours."
      >
        <div className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/[0.06]">
          <input
            type="time"
            defaultValue="23:00"
            className="bg-transparent font-mono text-[12px] text-zinc-200 outline-none"
          />
          <span className="text-[11px] text-zinc-500">→</span>
          <input
            type="time"
            defaultValue="07:00"
            className="bg-transparent font-mono text-[12px] text-zinc-200 outline-none"
          />
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}
