import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Prisma ORM 7+ expects a driver adapter for PostgreSQL (or Accelerate).
 * See https://pris.ly/d/prisma7-client-config
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim() || "";

  // Empty/missing DATABASE_URL makes `pg` default to 127.0.0.1:5432 — never allow that in production.
  if (!connectionString) {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_URL is missing or empty. Set your Railway/Postgres URL in Vercel → Settings → Environment Variables (Production), then redeploy.",
      );
    }
    console.warn(
      "[@orakly/database] DATABASE_URL unset — using local postgres fallback (dev only)",
    );
  }

  const adapter = new PrismaPg(
    connectionString || "postgresql://127.0.0.1:5432/postgres",
  );

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

/**
 * Single PrismaClient per Node isolate — use pooled DATABASE_URL on Vercel (PgBouncer /
 * `connection_limit`) to avoid exhausting Postgres connections under concurrent lambdas.
 */
export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
