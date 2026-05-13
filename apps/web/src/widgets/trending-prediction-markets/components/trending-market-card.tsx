"use client";

import {
  MarketCard,
  type MarketCardAccent,
  type MarketCardProps,
  type MarketCardVariant,
} from "@/features/markets/components/market-card";

export type TrendingMarketCardProps = Pick<
  MarketCardProps,
  | "market"
  | "index"
  | "volumeMax"
  | "isLive"
  | "lastTradeAt"
  | "className"
  | "chrome"
  | "directoryStyle"
> & {
  accent?: MarketCardAccent;
  variant?: MarketCardVariant;
};

/** Explorer / landing tape — delegates to `MarketCard` (trade modal + styling source). */
export function TrendingMarketCard({
  market,
  index = 0,
  accent = "cyan",
  chrome,
  volumeMax,
  isLive,
  lastTradeAt,
  variant = "default",
  directoryStyle,
  className,
}: TrendingMarketCardProps) {
  return (
    <MarketCard
      market={market}
      index={index}
      accent={accent}
      chrome={chrome}
      volumeMax={volumeMax}
      isLive={isLive}
      lastTradeAt={lastTradeAt}
      variant={variant}
      directoryStyle={directoryStyle}
      className={className}
    />
  );
}
