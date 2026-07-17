"use client";

import { motion } from "framer-motion";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import {
  Atom,
  Bot,
  Coins,
  Globe2,
  Landmark,
  Trophy,
  Cpu,
} from "lucide-react";
import { SectionShell } from "../components/section-shell";

const cats = [
  { name: "Crypto", icon: Coins, markets: "4.2k", vol: "$812M", hue: "cyan" },
  { name: "Macro", icon: Landmark, markets: "1.9k", vol: "$294M", hue: "violet" },
  { name: "Politics", icon: Globe2, markets: "3.1k", vol: "$560M", hue: "emerald" },
  { name: "Science", icon: Atom, markets: "890", vol: "$72M", hue: "sky" },
  { name: "Culture", icon: Trophy, markets: "2.4k", vol: "$128M", hue: "rose" },
  { name: "AI & Tech", icon: Cpu, markets: "1.2k", vol: "$204M", hue: "amber" },
  { name: "Memes", icon: Bot, markets: "6.8k", vol: "$91M", hue: "fuchsia" },
];

const hueBorder: Record<string, string> = {
  cyan: "hover:border-cyan-400/35 hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]",
  violet: "hover:border-violet-400/35 hover:shadow-[0_0_24px_-8px_rgba(167,139,250,0.35)]",
  emerald: "hover:border-emerald-400/35 hover:shadow-[0_0_24px_-8px_rgba(52,211,153,0.35)]",
  sky: "hover:border-sky-400/35 hover:shadow-[0_0_24px_-8px_rgba(56,189,248,0.35)]",
  rose: "hover:border-rose-400/35 hover:shadow-[0_0_24px_-8px_rgba(251,113,133,0.35)]",
  amber: "hover:border-amber-400/35 hover:shadow-[0_0_24px_-8px_rgba(251,191,36,0.35)]",
  fuchsia: "hover:border-fuchsia-400/35 hover:shadow-[0_0_24px_-8px_rgba(217,70,239,0.35)]",
};

export function CategoriesSection() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <SectionShell
      id="categories"
      eyebrow="Taxonomy"
      title="Market categories"
      description="Dense categorical routing across narratives. Each tile routes to filtered liquidity grids."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cats.map((c, i) => (
          <motion.button
            key={c.name}
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.035, 0.21) }}
            whileHover={reduceMotion ? {} : { y: -2 }}
            className={`glass-panel-strong group flex flex-col rounded-xl p-3.5 text-left ring-1 ring-white/10 transition ${hueBorder[c.hue] ?? ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <c.icon className="h-5 w-5 text-zinc-400 transition group-hover:text-cyan-300" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                {c.markets}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">{c.name}</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              30d vol <span className="tabular-nums text-zinc-400">{c.vol}</span>
            </p>
          </motion.button>
        ))}
      </div>
    </SectionShell>
  );
}
