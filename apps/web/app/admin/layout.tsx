import type { ReactNode } from "react";

/** Operator console — secure with ADMIN_SESSION_SECRET, ADMIN_API_TOKEN, and staff User roles. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-[15%] h-[380px] w-[380px] rounded-full bg-violet-600/9 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[10%] h-[300px] w-[300px] rounded-full bg-cyan-500/6 blur-[110px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
