import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** Next.js sets this while collecting page data / compiling for production. */
function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Prisma ORM 7+ expects a driver adapter for PostgreSQL (or Accelerate).
 * See https://pris.ly/d/prisma7-client-config
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim() || "";

  // Empty DATABASE_URL makes `pg` default to 127.0.0.1:5432. Fail loudly at
  // runtime in production — but never throw during `next build` (VERCEL=1 +
  // NODE_ENV=production) or page-data collection breaks (e.g. /api/admin/config).
  if (!connectionString) {
    if (
      !isNextBuildPhase() &&
      (process.env.VERCEL || process.env.NODE_ENV === "production")
    ) {
      throw new Error(
        "DATABASE_URL is missing or empty. Set your Railway/Postgres URL in Vercel → Settings → Environment Variables (Production), then redeploy.",
      );
    }
    if (!isNextBuildPhase()) {
      console.warn(
        "[@orakly/database] DATABASE_URL unset — using local postgres fallback (dev only)",
      );
    }
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

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy Proxy — avoids constructing Prisma (and throwing) at module-eval time
 * during Next.js build page-data collection.
 *
 * Use pooled DATABASE_URL on Vercel (PgBouncer / `connection_limit`) to avoid
 * exhausting Postgres connections under concurrent lambdas.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
