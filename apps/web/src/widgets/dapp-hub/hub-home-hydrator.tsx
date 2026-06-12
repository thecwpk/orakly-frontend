"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useRef } from "react";
import { queryKeys } from "@/shared/api/query-keys";
import type { HubHomeBundle } from "@/server/queries/hub-home-bundle";

function seedHubCache(qc: ReturnType<typeof useQueryClient>, data: HubHomeBundle) {
  qc.setQueryData(queryKeys.hub.stats(), data.stats);
  qc.setQueryData(queryKeys.hub.attention(), data.attention);
  qc.setQueryData(queryKeys.hub.narrativeWars(), data.narrativeWars);
  qc.setQueryData(queryKeys.hub.conviction(6), data.conviction);
  qc.setQueryData(queryKeys.hub.trending(20), data.trending);
  qc.setQueryData(queryKeys.hub.categories(), data.categories);
  qc.setQueryData(queryKeys.hub.suggestions(5), data.suggestions);
}

/** Seeds TanStack Query before hub sections mount so /dapp is never blank on first paint. */
export function HubHomeHydrator({
  data,
  children,
}: {
  data: HubHomeBundle;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const seeded = useRef(false);

  if (!seeded.current) {
    seedHubCache(qc, data);
    seeded.current = true;
  }

  return children;
}
