"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { LeaderboardAvatar } from "./leaderboard-avatar";
import { compactUsd, shortAddress, signedCompactUsd } from "../lib/format";

function AddressCell({ address }: { address: string }) {
  return (
    <Link
      href={ROUTES.traderProfile(address)}
      className="flex min-w-0 items-center gap-2.5 hover:text-cyan-200"
    >
      <LeaderboardAvatar address={address} />
      <span className="truncate font-mono text-[12.5px] text-[var(--foreground)]">
        {shortAddress(address)}
      </span>
    </Link>
  );
}

function RankCell({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-8 items-center justify-center rounded-md font-mono text-[10.5px] font-bold ring-1",
        rank <= 3
          ? "bg-amber-500/10 text-amber-200 ring-amber-400/25"
          : "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground)]/80 ring-[var(--border)]",
      )}
    >
      {rank}
    </span>
  );
}

type TraderRow = {
  rank: number;
  address: string;
  volumeUsd: number;
  tradeCount: number;
  winRatePct: number;
  pnlUsd: number;
  bestTradeUsd: number;
  marketsTraded: number;
};

function TableShell({
  headers,
  children,
  note,
}: {
  headers: string[];
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className="space-y-2">
      {note ? <p className="text-[11px] text-[var(--foreground-muted)]">{note}</p> : null}
      <div className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
            <thead className="border-b border-[var(--border)] bg-[var(--background)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-2.5 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]/80">{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function TopTradersTable({ rows }: { rows: TraderRow[] }) {
  return (
    <TableShell headers={["Rank", "Address", "Volume", "Total Trades", "Win Rate", "PnL"]}>
      {rows.map((row) => (
        <tr key={row.address} className="hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
          <td className="px-4 py-2.5">
            <RankCell rank={row.rank} />
          </td>
          <td className="px-4 py-2.5">
            <AddressCell address={row.address} />
          </td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{compactUsd(row.volumeUsd)}</td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{row.tradeCount}</td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{row.winRatePct.toFixed(1)}%</td>
          <td
            className={cn(
              "px-4 py-2.5 text-right font-mono tabular-nums",
              row.pnlUsd >= 0 ? "text-emerald-200" : "text-rose-200",
            )}
          >
            {signedCompactUsd(row.pnlUsd)}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

export function WinRateTable({ rows }: { rows: TraderRow[] }) {
  return (
    <TableShell
      headers={["Rank", "Address", "Win Rate", "Trades", "Volume"]}
      note="(min. 5 trades)"
    >
      {rows.map((row) => (
        <tr key={row.address} className="hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
          <td className="px-4 py-2.5">
            <RankCell rank={row.rank} />
          </td>
          <td className="px-4 py-2.5">
            <AddressCell address={row.address} />
          </td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{row.winRatePct.toFixed(1)}%</td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{row.tradeCount}</td>
          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
            {compactUsd(row.volumeUsd)}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

export function PnlTable({ rows }: { rows: TraderRow[] }) {
  return (
    <TableShell
      headers={["Rank", "Address", "Total PnL", "Best Single Trade", "Markets Traded"]}
    >
      {rows.map((row) => (
        <tr key={row.address} className="hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
          <td className="px-4 py-2.5">
            <RankCell rank={row.rank} />
          </td>
          <td className="px-4 py-2.5">
            <AddressCell address={row.address} />
          </td>
          <td
            className={cn(
              "px-4 py-2.5 font-mono tabular-nums",
              row.pnlUsd >= 0 ? "text-emerald-200" : "text-rose-200",
            )}
          >
            {signedCompactUsd(row.pnlUsd)}
          </td>
          <td className="px-4 py-2.5 font-mono tabular-nums">
            {compactUsd(row.bestTradeUsd)}
          </td>
          <td className="px-4 py-2.5 text-right font-mono tabular-nums">{row.marketsTraded}</td>
        </tr>
      ))}
    </TableShell>
  );
}

export type CreatorRow = {
  rank: number;
  address: string;
  approvedMarkets: number;
  volumeGenerated: number;
  feesEarned: number;
};

export function CreatorsTable({ rows }: { rows: CreatorRow[] }) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Address",
        "Approved Markets",
        "Volume Generated",
        "Fees Earned",
      ]}
    >
      {rows.map((row) => (
        <tr key={row.address} className="hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
          <td className="px-4 py-2.5">
            <RankCell rank={row.rank} />
          </td>
          <td className="px-4 py-2.5">
            <AddressCell address={row.address} />
          </td>
          <td className="px-4 py-2.5 font-mono tabular-nums">{row.approvedMarkets}</td>
          <td className="px-4 py-2.5 font-mono tabular-nums">
            {compactUsd(row.volumeGenerated)}
          </td>
          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-200">
            {compactUsd(row.feesEarned)}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

type YourRankTraderProps = {
  tab: "traders" | "winRate" | "pnl";
  address: string;
  row: TraderRow | null;
  rank: number | null;
};

type YourRankCreatorProps = {
  tab: "creators";
  address: string;
  row: CreatorRow | null;
  rank: number | null;
};

export function YourRankRow(props: YourRankTraderProps | YourRankCreatorProps) {
  const rankLabel = props.rank != null ? `#${props.rank}` : "N/A";

  if (props.tab === "creators") {
    const creatorRow = props.row;
    return (
      <div className="sticky bottom-4 z-10 mt-4 rounded-xl border border-cyan-400/25 bg-[var(--background)] px-4 py-3 shadow-lg backdrop-blur-md ring-1 ring-cyan-400/20">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/90">
          Your rank
        </div>
        <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-5">
          <div>
            <p className="text-[var(--foreground-muted)]">Rank</p>
            <p className="font-mono font-semibold text-[var(--foreground)]">{rankLabel}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[var(--foreground-muted)]">Address</p>
            <AddressCell address={props.address} />
          </div>
          <div>
            <p className="text-[var(--foreground-muted)]">Approved</p>
            <p className="font-mono text-[var(--foreground)]">
              {creatorRow ? creatorRow.approvedMarkets : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[var(--foreground-muted)]">Volume</p>
            <p className="font-mono text-[var(--foreground)]">
              {creatorRow ? compactUsd(creatorRow.volumeGenerated) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[var(--foreground-muted)]">Fees</p>
            <p className="font-mono text-[var(--foreground)]">
              {creatorRow ? compactUsd(creatorRow.feesEarned) : "N/A"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const traderRow = props.row;

  return (
    <div className="sticky bottom-4 z-10 mt-4 rounded-xl border border-cyan-400/25 bg-[var(--background)] px-4 py-3 shadow-lg backdrop-blur-md ring-1 ring-cyan-400/20">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/90">
        Your rank
      </div>
      <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-6">
        <div>
          <p className="text-[var(--foreground-muted)]">Rank</p>
          <p className="font-mono font-semibold text-[var(--foreground)]">{rankLabel}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[var(--foreground-muted)]">Address</p>
          <AddressCell address={props.address} />
        </div>
        {props.tab === "traders" ? (
          <>
            <div>
              <p className="text-[var(--foreground-muted)]">Volume</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? compactUsd(traderRow.volumeUsd) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Trades</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? traderRow.tradeCount : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Win rate</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? `${traderRow.winRatePct.toFixed(1)}%` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">PnL</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? signedCompactUsd(traderRow.pnlUsd) : "N/A"}
              </p>
            </div>
          </>
        ) : props.tab === "winRate" ? (
          <>
            <div>
              <p className="text-[var(--foreground-muted)]">Win rate</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? `${traderRow.winRatePct.toFixed(1)}%` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Trades</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? traderRow.tradeCount : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Volume</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? compactUsd(traderRow.volumeUsd) : "N/A"}
              </p>
            </div>
            <div />
          </>
        ) : (
          <>
            <div>
              <p className="text-[var(--foreground-muted)]">PnL</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? signedCompactUsd(traderRow.pnlUsd) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Best trade</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? compactUsd(traderRow.bestTradeUsd) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground-muted)]">Markets</p>
              <p className="font-mono text-[var(--foreground)]">
                {traderRow ? traderRow.marketsTraded : "N/A"}
              </p>
            </div>
            <div />
          </>
        )}
      </div>
    </div>
  );
}

export type { TraderRow };
