"use client";

import { useSyncExternalStore } from "react";
import {
  getPortfolioGeneration,
  subscribePortfolioGeneration,
} from "../store/portfolio-generation-store";

/** Tick when server pushes `portfolio:refresh` for this user — pair with React Query `invalidateQueries`. */
export function usePortfolioRealtimeTick(userId: string | undefined) {
  return useSyncExternalStore(
    (cb) => subscribePortfolioGeneration(userId, cb),
    () => getPortfolioGeneration(userId),
    () => 0,
  );
}
