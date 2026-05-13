export type OrderId = string;

export type OrderSide = "BUY" | "SELL";

export type OrderEntity = {
  id: OrderId;
  marketId: string;
  side: OrderSide;
  size: number;
  limitPrice?: number;
};
