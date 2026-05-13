/**
 * Single source of truth for the public market-creation contract.
 * Imported by:
 *   - client wizard (react-hook-form-free, validated step-by-step)
 *   - POST /api/v1/markets/create route handler
 *
 * Keep this file framework-agnostic — no React, no Next.
 */
import { z } from "zod";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const RESOLUTION_SOURCES = [
  "ORACLE",
  "OFFICIAL",
  "COMMUNITY",
  "MANUAL",
] as const;
export type ResolutionSource = (typeof RESOLUTION_SOURCES)[number];

export const basicsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Title is too short — be specific.")
    .max(140, "Keep titles under 140 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters.")
    .max(80, "Slug too long.")
    .regex(SLUG_RE, "Use lowercase letters, digits, and dashes only."),
  category: z.string().min(2, "Pick a category."),
  description: z
    .string()
    .trim()
    .max(2000, "Description too long.")
    .optional()
    .default(""),
});

export const resolutionSchema = z.object({
  source: z.enum(RESOLUTION_SOURCES),
  sourceUrl: z
    .string()
    .trim()
    .url("Provide a valid HTTPS URL.")
    .refine((u) => u.startsWith("https://"), "Use an https:// URL.")
    .optional()
    .or(z.literal("")),
  resolverNote: z.string().trim().max(500).optional().default(""),
});

export const timelineSchema = z
  .object({
    opensAt: z.string().datetime().optional().or(z.literal("")),
    closesAt: z.string().datetime("Pick a closing date."),
  })
  .superRefine((val, ctx) => {
    const closes = new Date(val.closesAt).getTime();
    const opens = val.opensAt ? new Date(val.opensAt).getTime() : Date.now();
    if (Number.isNaN(closes)) return;
    if (closes <= Date.now() + 5 * 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closesAt"],
        message: "Closing time must be at least 5 minutes in the future.",
      });
    }
    if (val.opensAt && opens >= closes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closesAt"],
        message: "Closing time must be after opening time.",
      });
    }
  });

export const liquiditySchema = z.object({
  liquiditySeedUsd: z
    .number()
    .min(100, "Minimum seed is $100.")
    .max(1_000_000, "Maximum seed is $1M."),
  initialProbability: z
    .number()
    .min(0.01, "Probability must be between 1% and 99%.")
    .max(0.99, "Probability must be between 1% and 99%."),
  takerFeeBps: z
    .number()
    .int()
    .min(0, "Fee can't be negative.")
    .max(500, "Maximum 500 bps (5%)."),
});

/** Composed schema used by the API route. */
export const createMarketSchema = basicsSchema
  .and(resolutionSchema)
  .and(timelineSchema)
  .and(liquiditySchema);

export type CreateMarketPayload = z.infer<typeof createMarketSchema>;
