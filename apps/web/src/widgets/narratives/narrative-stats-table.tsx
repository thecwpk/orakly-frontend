import { cn } from "@/lib/utils";
import type { NarrativeStatRow } from "@/server/queries/narrative-detail";

type NarrativeStatsTableProps = {
  rows: NarrativeStatRow[];
};

function ChangeBadge({ changePct }: { changePct: number }) {
  const positive = changePct > 0;
  const negative = changePct < 0;
  const label = `${positive ? "+" : ""}${changePct.toFixed(1)}%`;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        positive && "bg-emerald-100 text-emerald-700",
        negative && "bg-red-100 text-red-700",
        !positive && !negative && "bg-gray-100 text-gray-600",
      )}
    >
      {label}
    </span>
  );
}

export function NarrativeStatsTable({ rows }: NarrativeStatsTableProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Narrative stats
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-b-0">
                <th className="px-4 py-3 font-medium text-gray-600">{row.label}</th>
                <td className="px-4 py-3 font-semibold text-gray-900">{row.value}</td>
                <td className="px-4 py-3 text-right">
                  <ChangeBadge changePct={row.changePct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
