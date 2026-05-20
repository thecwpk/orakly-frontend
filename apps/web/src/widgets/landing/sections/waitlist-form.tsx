"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Real waitlist form — replaces v1 "Join waitlist" anchor link that
 * scrolled to the footer and dropped the email.
 *
 * Posts to `/api/waitlist`. The honeypot `company` field is hidden in
 * the layout; bots fill every text field, real users don't see it.
 */
export function WaitlistForm({ source = "landing-hero", compact = false }: { source?: string; compact?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const company = String(data.get("company") ?? "");
    if (!email) return;
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company, source }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("success");
        setMessage("Thank you. You will hear from us when there is news to share.");
        form.reset();
        return;
      }
      setStatus("error");
      setMessage(json.error ?? "Something went wrong. Try again.");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Subscribe to Orakly updates" className="w-full">
      {/* Honeypot — hidden from real users, filled by bots. */}
      <label className="sr-only" aria-hidden>
        Company
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        />
      </label>

      <div className={cn("flex flex-col gap-3 sm:flex-row", compact && "sm:items-stretch")}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@domain.com"
            disabled={status === "loading" || status === "success"}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-yes/45 focus:outline-none focus:ring-2 focus:ring-yes/30 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-[color:color-mix(in_srgb,var(--primary)_72%,black)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-14px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-white/10 transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Submitting…
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="size-4" aria-hidden />
              Subscribed
            </>
          ) : (
            <>
              Get updates
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-3 text-xs leading-relaxed",
          status === "success"
            ? "text-yes"
            : status === "error"
              ? "text-no"
              : "text-muted-foreground",
        )}
      >
        {message ?? "We use your email only for product updates. No spam, no resale."}
      </p>
    </form>
  );
}
