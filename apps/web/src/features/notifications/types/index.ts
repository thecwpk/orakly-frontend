export type AppNotificationType =
  | "SETTLEMENT"
  | "APPROVAL"
  | "VOTE"
  | "REWARD"
  | "MARKET_CLOSING"
  | "NEW_MARKET";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  message: string;
  /** ISO timestamp. */
  at: string;
  href?: string | null;
  marketSlug?: string | null;
  read: boolean;
};

/** @deprecated Prefer AppNotificationType — kept for activity feed adapters. */
export type NotificationKind =
  | "FILL"
  | "SETTLE"
  | "ALERT"
  | "MENTION"
  | "SYSTEM"
  | AppNotificationType;

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  href?: string;
  marketSlug?: string;
  read: boolean;
};

export type NotificationFilter = "all" | NotificationKind;
