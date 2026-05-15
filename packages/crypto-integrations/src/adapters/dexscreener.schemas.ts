import { z } from "zod";

export const DexBoostRowSchema = z
  .object({
    chainId: z.string(),
    tokenAddress: z.string(),
    totalAmount: z.number().optional(),
    amount: z.number().optional(),
    description: z.string().optional(),
    header: z.string().optional(),
    icon: z.string().optional(),
  })
  .passthrough();

export const DexBoostResponseSchema = z.array(DexBoostRowSchema);

export const DexPairSchema = z
  .object({
    chainId: z.string(),
    dexId: z.string(),
    pairAddress: z.string(),
    baseToken: z.object({
      address: z.string(),
      name: z.string().optional(),
      symbol: z.string().optional(),
    }),
    priceUsd: z.union([z.string(), z.number()]).optional(),
    liquidity: z.object({ usd: z.number().optional() }).optional(),
    fdv: z.number().optional(),
    volume: z.object({ h24: z.number().optional() }).optional(),
    pairCreatedAt: z.number().optional(),
    priceChange: z.object({ h24: z.number().optional() }).optional(),
    info: z.object({ imageUrl: z.string().optional() }).optional(),
  })
  .passthrough();

export const DexPairsResponseSchema = z
  .object({
    pairs: z.array(DexPairSchema),
  })
  .passthrough();
