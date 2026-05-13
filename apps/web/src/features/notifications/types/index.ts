export type NotificationKind =
  | "FILL"
  | "SETTLE"
  | "ALERT"
  | "MENTION"
  | "SYSTEM";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO timestamp. */
  at: string;
  /** Optional deep link target — clicking the notification routes here. */
  href?: string;
  /** Optional explicit market slug for downstream routing helpers. */
  marketSlug?: string;
  read: boolean;
};

export type NotificationFilter = "all" | NotificationKind;
