"use client";

import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminApiError, adminLogin } from "./lib/admin-api";

function safeAdminNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin")) return "/admin/dashboard";
  if (raw.startsWith("/admin/login")) return "/admin/dashboard";
  return raw;
}

export function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await adminLogin(token.trim(), actorUserId.trim());
      toast.success("Session established");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeAdminNextPath(next));
    } catch (e) {
      toast.error(e instanceof AdminApiError ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong neon-edge-violet rounded-2xl p-6 ring-1 ring-white/6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/30">
            <KeyRound className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Operator sign-in</h1>
            <p className="text-[13px] text-zinc-500">Bootstrap token + staff user UUID.</p>
          </div>
        </div>

        <label className="mt-6 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Admin API token (header)
        </label>
        <input
          type="password"
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-white/8 bg-black/35 px-3 py-2.5 font-mono text-[13px] text-white outline-none focus:border-violet-500/40"
          placeholder="ADMIN_API_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Actor user id (UUID)
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-white/8 bg-black/35 px-3 py-2.5 font-mono text-[13px] text-white outline-none focus:border-violet-500/40"
          placeholder="User.id with role ADMIN or MODERATOR"
          value={actorUserId}
          onChange={(e) => setActorUserId(e.target.value)}
        />

        <button
          type="button"
          disabled={busy || !token.trim() || !actorUserId.trim()}
          onClick={() => void submit()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600/90 to-cyan-600/85 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ?
            <Loader2 className="h-4 w-4 animate-spin" />
          : null}
          Continue
        </button>

        <p className="mt-4 text-center text-[12px] text-zinc-600">
          Sets an HttpOnly session cookie (HS256). Rotate <span className="font-mono">ADMIN_API_TOKEN</span>{" "}
          regularly.
        </p>

        <Link
          href="/"
          className="mt-6 block text-center text-[13px] text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
        >
          Back to site
        </Link>
      </motion.div>
    </div>
  );
}
