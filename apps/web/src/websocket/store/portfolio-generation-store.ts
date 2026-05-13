const generations = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();

function ensureSet(userId: string): Set<() => void> {
  let s = listeners.get(userId);
  if (!s) {
    s = new Set();
    listeners.set(userId, s);
  }
  return s;
}

export function subscribePortfolioGeneration(
  userId: string | undefined,
  cb: () => void,
): () => void {
  if (!userId) return () => {};
  const s = ensureSet(userId);
  s.add(cb);
  return () => {
    s.delete(cb);
    if (s.size === 0) {
      listeners.delete(userId);
      generations.delete(userId);
    }
  };
}

export function getPortfolioGeneration(userId: string | undefined): number {
  if (!userId) return 0;
  return generations.get(userId) ?? 0;
}

export function bumpPortfolioGeneration(userId: string) {
  generations.set(userId, (generations.get(userId) ?? 0) + 1);
  const subs = listeners.get(userId);
  if (!subs) return;
  for (const fn of subs) fn();
}
