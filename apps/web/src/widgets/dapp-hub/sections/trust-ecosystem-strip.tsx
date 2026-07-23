"use client";

const TRUST_ITEMS = [
  { id: "bsc", label: "Powered by BNB Chain" },
  { id: "wc", label: "WalletConnect" },
  { id: "mm", label: "MetaMask" },
  { id: "tw", label: "Trust Wallet" },
  { id: "audit", label: "Auditable on-chain" },
  { id: "decentral", label: "Non-custodial trading" },
] as const;

function TrustIcon({ id }: { id: string }) {
  const common = "flex size-9 items-center justify-center rounded-lg border border-[var(--hub-glass-border)] bg-white/[0.04] text-[10px] font-bold uppercase text-[var(--hub-muted)]";
  if (id === "bsc") {
    return (
      <span className={common} style={{ color: "#F0B90B" }}>
        BSC
      </span>
    );
  }
  if (id === "wc") return <span className={common}>WC</span>;
  if (id === "mm") return <span className={common}>MM</span>;
  if (id === "tw") return <span className={common}>TW</span>;
  if (id === "audit") return <span className={common}>⛓</span>;
  return <span className={common}>◈</span>;
}

/** Trust / ecosystem logos row — honest labels, no fake audit claims. */
export function TrustEcosystemStrip() {
  return (
    <section className="hub-section hub-section-enter" aria-label="Ecosystem trust">
      <div className="hub-trust-strip">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
          Built for on-chain prediction markets
        </p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_ITEMS.map((item) => (
            <li key={item.id} className="flex flex-col items-center gap-2 text-center">
              <TrustIcon id={item.id} />
              <span className="text-[11px] leading-snug text-[var(--hub-muted)]">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
