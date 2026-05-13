import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Minimal centered layout for /sign-in (and any future /connect, /verify).
 * Intentionally distinct from the (app) layout — no global navbar/footer, just
 * a focused glass card on the gradient backdrop. The header logo is the only
 * way back home so the auth path doesn't get cluttered.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#050508] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-1/2 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-violet-600/14 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.30]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 py-5">
          <Link
            href="/"
            className="inline-flex flex-col leading-none transition hover:opacity-90"
          >
            <span className="text-[15px] font-semibold tracking-tight text-white">
              Orakly
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              Prediction liquidity
            </span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          {children}
        </main>

        <footer className="px-6 py-5 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          Custodial · audited flows
        </footer>
      </div>
    </div>
  );
}
