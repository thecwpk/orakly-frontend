"use client";

import { memo, useCallback, useEffect, useState } from "react";

type Comment = { id: string; body: string; at: number };

const storageKey = (slug: string) => `orakly:market-comments:${slug}`;

function load(slug: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Comment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(slug: string, rows: Comment[]) {
  sessionStorage.setItem(storageKey(slug), JSON.stringify(rows));
}

function MarketCommentsInner({ slug }: { slug: string }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(load(slug));
  }, [slug]);

  const post = useCallback(() => {
    const body = draft.trim();
    if (!body) return;
    const row: Comment = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto ?
          crypto.randomUUID()
        : String(Date.now()),
      body,
      at: Date.now(),
    };
    setItems((prev) => {
      const next = [row, ...prev].slice(0, 80);
      save(slug, next);
      return next;
    });
    setDraft("");
  }, [draft, slug]);

  if (!mounted) {
    return (
      <div className="glass-panel-strong h-[200px] animate-pulse rounded-2xl bg-white/2" aria-hidden />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#08080f]/90 ring-1 ring-white/[0.04]">
      <div className="border-b border-white/6 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Comments
        </p>
        <p className="text-[12px] font-medium text-white">Session notes · local only</p>
      </div>
      <div className="space-y-2 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note on this market…"
          className="w-full resize-none rounded-md border border-white/8 bg-black/40 px-2.5 py-1.5 text-[12.5px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-500/35"
        />
        <button
          type="button"
          onClick={post}
          className="rounded-md bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/12"
        >
          Post
        </button>
      </div>
      <ul className="max-h-[220px] divide-y divide-white/4 overflow-y-auto px-2 pb-2">
        {items.length === 0 ?
          <li className="px-2 py-6 text-center text-[12px] text-zinc-500">No comments yet.</li>
        : items.map((c) => (
            <li key={c.id} className="px-2 py-2.5">
              <p className="text-[13px] leading-snug text-zinc-200">{c.body}</p>
              <p className="mt-1 font-mono text-[10px] text-zinc-600">
                {new Date(c.at).toLocaleString()}
              </p>
            </li>
          ))
        }
      </ul>
    </div>
  );
}

export const MarketComments = memo(MarketCommentsInner);
