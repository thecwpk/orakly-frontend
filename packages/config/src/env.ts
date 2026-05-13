import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("orakly market"),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof envSchema>;

export function getPublicEnv(input: Record<string, string | undefined>): PublicEnv {
  return envSchema.parse(input);
}
