import { prisma } from "@orakly/database";
import { LedgerEntryType } from "@prisma/client";

export type NotificationDto = {
  id: string;
  kind: "FILL" | "SETTLE" | "ALERT" | "MENTION" | "SYSTEM";
  title: string;
  body: string;
  at: string;
  href: string | null;
  marketSlug: string | null;
  read: boolean;
};

function ledgerKindToNotification(type: LedgerEntryType): NotificationDto["kind"] {
  switch (type) {
    case LedgerEntryType.TRADE:
      return "FILL";
    case LedgerEntryType.PNL:
    case LedgerEntryType.REFUND:
      return "SETTLE";
    case LedgerEntryType.DEPOSIT:
    case LedgerEntryType.WITHDRAW:
      return "SYSTEM";
    default:
      return "SYSTEM";
  }
}

function ledgerTitle(type: LedgerEntryType, amount: string): string {
  const abs = amount.startsWith("-") ? amount.slice(1) : amount;
  switch (type) {
    case LedgerEntryType.TRADE:
      return `Trade filled · $${abs}`;
    case LedgerEntryType.PNL:
      return `Settlement credit · $${abs}`;
    case LedgerEntryType.REFUND:
      return `Refund · $${abs}`;
    case LedgerEntryType.DEPOSIT:
      return `Deposit confirmed · $${abs}`;
    case LedgerEntryType.WITHDRAW:
      return `Withdrawal · $${abs}`;
    default:
      return "Ledger update";
  }
}

export async function listUserNotifications(
  userId: string,
  options?: { limit?: number },
): Promise<NotificationDto[]> {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 120);

  const [ledgerRows, activities] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { market: { select: { slug: true } } },
    }),
  ]);

  const fromLedger: NotificationDto[] = ledgerRows.map((row) => ({
    id: `ledger:${row.id}`,
    kind: ledgerKindToNotification(row.type),
    title: ledgerTitle(row.type, row.amount.toFixed()),
    body: row.txHash ? `Ref ${row.txHash}` : "Custodial ledger entry",
    at: row.timestamp.toISOString(),
    href: null,
    marketSlug: null,
    read: false,
  }));

  const fromActivity: NotificationDto[] = activities.map((row) => ({
    id: `activity:${row.id}`,
    kind: row.type === "LARGE_TRADE" ? "ALERT" : "SYSTEM",
    title: row.title ?? row.type,
    body:
      typeof row.payload === "object" && row.payload && "message" in row.payload
        ? String((row.payload as { message: unknown }).message)
        : row.type,
    at: row.createdAt.toISOString(),
    href: row.market?.slug ? `/markets/${row.market.slug}` : null,
    marketSlug: row.market?.slug ?? null,
    read: false,
  }));

  return [...fromLedger, ...fromActivity]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
