"use client";

import type { ReactNode } from "react";
import { FooterSection } from "../sections/footer-section";
import { LandingNavbar } from "./landing-navbar";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#050508] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-[10%] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute top-1/3 right-[-10%] h-[380px] w-[380px] rounded-full bg-violet-600/14 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-1/4 h-[360px] w-[360px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10">
        <LandingNavbar />
        {children}
        <FooterSection />
      </div>
    </div>
  );
}
