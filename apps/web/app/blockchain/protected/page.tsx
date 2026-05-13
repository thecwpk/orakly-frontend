"use client";

import Link from "next/link";
import { LandingShell } from "@/widgets/landing/components/landing-shell";
import { BlockchainGate } from "@/features/wallet/components/blockchain-gate";
import { useWalletSessionQuery } from "@/features/wallet/hooks/use-wallet-session-query";

export default function ProtectedBlockchainPage() {
  const { data: session } = useWalletSessionQuery();

  return (
    <LandingShell>
      <main className="relative mx-auto max-w-3xl px-4 pb-24 pt-12 sm:pt-16">
        <Link
          href="/blockchain/connect"
          className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          ← Back to Web3 setup
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Protected blockchain workspace
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">
          This subtree is gated server-side via the wallet JWT cookie and client-side via{" "}
          <span className="font-mono text-zinc-300">BlockchainGate</span>. Wrong-network
          recovery uses wagmi&apos;s chain switcher surfaced through RainbowKit.
        </p>

        <div className="mt-10">
          <BlockchainGate requireSignature>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Session address
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm text-cyan-100">
                    {session?.address ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Chain id
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-zinc-200">
                    {session?.chainId ?? "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-sm leading-relaxed text-zinc-500">
                Wire prediction-market settlement contracts here — hooks such as{" "}
                <span className="font-mono text-zinc-400">useTrackedWriteContract</span>{" "}
                already emit staged transaction state for premium UI overlays.
              </p>
            </div>
          </BlockchainGate>
        </div>
      </main>
    </LandingShell>
  );
}
