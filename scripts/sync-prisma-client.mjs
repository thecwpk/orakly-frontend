/**
 * Prisma generates into packages/database; Next resolves @prisma/client from root node_modules.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const databasePkg = join(frontendRoot, "packages", "database");
const pkgPrisma = join(databasePkg, "node_modules", ".prisma");
const rootPrisma = join(frontendRoot, "node_modules", ".prisma");
const src = existsSync(pkgPrisma) ? pkgPrisma : rootPrisma;
const dest = rootPrisma;

if (!existsSync(join(databasePkg, "package.json"))) {
  console.warn("[sync-prisma-client] Skip: packages/database missing");
  process.exit(0);
}

if (!existsSync(src)) {
  console.warn("[sync-prisma-client] Skip: run npm run db:generate first");
  process.exit(0);
}

if (src === dest) {
  console.log("[sync-prisma-client] Prisma client already at repo root");
  process.exit(0);
}

if (!existsSync(join(frontendRoot, "node_modules"))) {
  mkdirSync(join(frontendRoot, "node_modules"), { recursive: true });
}

cpSync(src, dest, { recursive: true });
console.log("[sync-prisma-client] synced →", dest);
