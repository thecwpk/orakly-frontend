"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { tbnbChain } from "../config/chains";
import { useRequireTbnb } from "../hooks/use-require-tbnb";
import { useWalletSessionQuery } from "../hooks/use-wallet-session-query";
import { PremiumPolymarketConnect } from "./premium-polymarket-connect";

type BlockchainGateProps = {
  children: ReactNode;
  /** Require RainbowKit authentication (SIWE-style cookie session). */
  requireSignature?: boolean;
};

export function BlockchainGate({
  children,
  requireSignature = true,
}: BlockchainGateProps) {
  const { isConnected, address } = useAccount();
  const { data: session, isPending: sessionPending } = useWalletSessionQuery();
  const { isCorrectChain, ensureTbnb, isSwitching } = useRequireTbnb();

  const sessionMatchesWallet =
    Boolean(session &&
      address &&
      session.address.toLowerCase() === address.toLowerCase());

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-6 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] sm:p-8">
        <p className="text-[15px] font-medium text-white">Wallet required</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Link MetaMask or WalletConnect to interact with TBNB settlement flows.
        </p>
        <div className="mt-6 flex justify-center">
          <PremiumPolymarketConnect />
        </div>
      </section>
    );
  }

  if (!isCorrectChain) {
    return (
      <section className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-6 text-center sm:p-8">
        <p className="text-[15px] font-medium text-amber-50">Wrong network</p>
        <p className="mt-2 text-sm text-amber-100/85">
          Switch to {tbnbChain.name} (chain id {tbnbChain.id}) to continue.
        </p>
        <button
          type="button"
          disabled={isSwitching}
          onClick={() => void ensureTbnb()}
          className="mx-auto mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-400/90 px-4 py-2 text-[13px] font-semibold text-zinc-950 shadow-md shadow-amber-500/15 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {isSwitching ?
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Switching…
            </>
          : "Switch network"}
        </button>
      </section>
    );
  }

  if (requireSignature) {
    if (sessionPending) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-14">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300" aria-hidden />
          <p className="text-sm text-zinc-400">Checking wallet session…</p>
        </div>
      );
    }

    if (!sessionMatchesWallet) {
      return (
        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] p-6 text-center sm:p-8">
          <p className="text-[15px] font-medium text-cyan-50">Authenticate wallet</p>
          <p className="mt-2 text-sm leading-relaxed text-cyan-100/80">
            Sign the one-time message to mint an HTTP-only session cookie for protected
            routes.
          </p>
          <div className="mt-6 flex justify-center">
            <PremiumPolymarketConnect />
          </div>
        </section>
      );
    }
  }

  return <>{children}</>;
}
