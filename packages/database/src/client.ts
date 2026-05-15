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
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://127.0.0.1:5432/postgres";

  const adapter = new PrismaPg(connectionString);

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
