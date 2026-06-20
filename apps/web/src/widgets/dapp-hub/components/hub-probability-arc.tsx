/** Semicircular probability gauge (Polymarket Up/Down cards). */
export function HubProbabilityArc({
  probability,
  label,
}: {
  probability: number;
  label: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, probability)) * 100);
  const r = 16;
  const cx = 20;
  const cy = 20;
  const startX = cx - r;
  const endX = cx + r;
  const path = `M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`;
  const length = Math.PI * r;
  const dash = (pct / 100) * length;

  return (
    <div className="hub-prob-arc" aria-hidden>
      <svg viewBox="0 0 40 24" className="hub-prob-arc-svg">
        <path d={path} fill="none" strokeWidth="3" strokeLinecap="round" />
        <path
          d={path}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${length}`}
        />
      </svg>
      <span className="hub-prob-arc-text">
        {pct}% {label}
      </span>
    </div>
  );
}
