"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { AdminApiError, adminLogin } from "./lib/admin-api";
import { useAdminWalletBootstrap } from "./hooks/use-admin-wallet-bootstrap";

function safeAdminNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin")) return ROUTES.adminDashboard;
  if (raw.startsWith(ROUTES.adminLogin)) return ROUTES.adminDashboard;
  return raw;
}

export function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeAdminNextPath(searchParams.get("next"));

  const { state: bootstrapState, walletOperator, bootstrap } =
    useAdminWalletBootstrap(nextPath);

  const [token, setToken] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await adminLogin(token.trim(), actorUserId.trim());
      toast.success("Session established");
      router.replace(nextPath);
    } catch (e) {
      toast.error(e instanceof AdminApiError ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  if (bootstrapState === "booting" || bootstrapState === "ready") {
    return (
      <div className="hub-container flex min-h-[50vh] flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-[var(--hub-primary-bright)]" />
        <p className="text-sm text-[var(--hub-muted)]">Opening operator console…</p>
      </div>
    );
  }

  return (
    <div className="hub-container flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-12 sm:mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)]/80 p-6 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] ring-1 ring-[var(--hub-border)] backdrop-blur-sm sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border-strong)]">
            <Shield className="h-5 w-5 text-[var(--hub-primary-bright)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--hub-fg)]">Operator access</h1>
            <p className="text-[13px] text-[var(--hub-muted)]">
              {walletOperator
                ? "Wallet recognized. Retry sign-in below."
                : "Connect an admin wallet or use a bootstrap token."}
            </p>
          </div>
        </div>

        {!walletOperator ? (
          <div className="mt-6 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60 p-4">
            <p className="text-[13px] text-[var(--hub-muted)]">
              Sign in with your operator wallet on BNB Testnet — the Admin tab unlocks
              after connect + signature.
            </p>
            <div className="mt-4 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void bootstrap().then((ok) => ok && router.replace(nextPath))}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--hub-primary)] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Continue with connected wallet
          </button>
        )}

        <details className="mt-6 rounded-xl border border-[var(--hub-border)] bg-black/20 px-4 py-3">
          <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
            Bootstrap token (dev)
          </summary>
          <div className="mt-4 space-y-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
              Admin API token
            </label>
            <input
              type="password"
              autoComplete="off"
              className="w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2.5 font-mono text-[13px] text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50"
              placeholder="ADMIN_API_TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
              Actor user id (UUID)
            </label>
            <input
              className="w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2.5 font-mono text-[13px] text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50"
              placeholder="User.id with role ADMIN or MODERATOR"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
            />
            <button
              type="button"
              disabled={busy || !token.trim() || !actorUserId.trim()}
              onClick={() => void submit()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--hub-primary)] to-cyan-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : (
                <KeyRound className="h-4 w-4" />
              )}
              Continue with token
            </button>
          </div>
        </details>

        <PrefetchLink
          href={ROUTES.dapp}
          className="mt-6 block text-center text-[13px] text-[var(--hub-muted)] underline-offset-4 hover:text-[var(--hub-fg)] hover:underline"
        >
          Back to Home
        </PrefetchLink>
      </motion.div>
    </div>
  );
}
