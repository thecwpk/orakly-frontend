"use client";

import Link from "next/link";
import { LandingShell } from "@/widgets/landing/components/landing-shell";
import { BlockchainGate } from "@/features/wallet/components/blockchain-gate";

/**
 * /blockchain/connect lives outside the (app) route group because the
 * `/blockchain/protected` sibling has its own server-side cookie-gated layout.
 * Keep the LandingShell here so the navbar still renders.
 */
export default function BlockchainConnectPage() {
  return (
    <LandingShell>
      <main className="relative mx-auto max-w-lg px-4 pb-24 pt-12 sm:pt-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
          Settlement layer
        </p>
        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Connect & authenticate on TBNB
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Wallet persistence and auto-reconnect are handled by wagmi. After connecting,
          sign once to receive an HTTP-only session used by protected blockchain routes.
        </p>

        <div className="mt-10 space-y-6">
          <BlockchainGate requireSignature>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-6 text-center">
              <p className="text-[15px] font-medium text-emerald-50">
                Wallet session active
              </p>
              <p className="mt-2 text-sm text-emerald-100/85">
                You can open on-chain tools secured by the session cookie.
              </p>
              <Link
                href="/blockchain/protected"
                className="mx-auto mt-5 inline-flex rounded-lg bg-emerald-400 px-4 py-2 text-[13px] font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Continue to protected route
              </Link>
            </div>
          </BlockchainGate>

          <p className="text-center text-[13px] text-zinc-600">
            Need WalletConnect on mobile? Configure{" "}
            <span className="font-mono text-zinc-500">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</span>
            .
          </p>
        </div>
      </main>
    </LandingShell>
  );
}
