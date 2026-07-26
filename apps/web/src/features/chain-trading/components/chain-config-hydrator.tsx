"use client";

import { useEffect } from "react";
import {
  hydrateRuntimeFactoryFromStorage,
  setRuntimeFactoryAddress,
} from "@/lib/chain-public-env";

/**
 * Pull factory address from platform config / localStorage so MetaMask upgrades
 * apply without a full Vercel rebuild.
 */
export function ChainConfigHydrator() {
  useEffect(() => {
    hydrateRuntimeFactoryFromStorage();
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/v1/chain/config", { cache: "no-store" });
        const payload = (await res.json()) as {
          ok?: boolean;
          data?: { factoryAddress?: string; factoryDeployBlock?: string };
        };
        if (cancelled || !payload.ok || !payload.data?.factoryAddress) return;
        setRuntimeFactoryAddress(
          payload.data.factoryAddress,
          payload.data.factoryDeployBlock,
        );
      } catch {
        /* keep env / storage fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
