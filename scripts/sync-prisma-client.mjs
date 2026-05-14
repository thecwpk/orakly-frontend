/**
 * Prisma generates into orakly-backend/node_modules (schema lives there).
 * Next resolves @prisma/client from orakly-frontend/node_modules — copy generated `.prisma` here.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const backendRoot = join(frontendRoot, "..", "orakly-backend");
const src = join(backendRoot, "node_modules", ".prisma");
const destParent = join(frontendRoot, "node_modules");
const dest = join(destParent, ".prisma");

if (!existsSync(src)) {
  console.warn(
    "[sync-prisma-client] Skip: no backend generated client at\n  " +
      src +
      "\n  Run: npm run db:generate --prefix ../orakly-backend",
  );
  process.exit(0);
}

if (!existsSync(destParent)) {
  mkdirSync(destParent, { recursive: true });
}

cpSync(src, dest, { recursive: true });
console.log("[sync-prisma-client] synced →", dest);
