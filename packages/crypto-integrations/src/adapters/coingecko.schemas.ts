import { z } from "zod";

const CoinItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    market_cap_rank: z.number().nullable().optional(),
    thumb: z.string().optional(),
    score: z.number().optional(),
    data: z
      .object({
        price: z.number().optional(),
        total_volume: z.union([z.string(), z.number()]).optional(),
        price_change_percentage_24h: z
          .record(z.string(), z.union([z.number(), z.string()]))
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const CoinGeckoTrendingSchema = z.object({
  coins: z.array(z.object({ item: CoinItemSchema })),
});
