/**
 * Ensures `orakly-frontend/orakly-backend` exists for `file:../../orakly-backend` deps.
 * - Local: junction/symlink to sibling ../orakly-backend when present
 * - Vercel: clone via ensure-backend-for-vercel.mjs before install
 */
import { existsSync, lstatSync, symlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const inRepo = join(frontendRoot, "orakly-backend");
const sibling = join(frontendRoot, "..", "orakly-backend");
const marker = join(inRepo, "packages", "database", "package.json");

function hasBackend(path) {
  return existsSync(join(path, "packages", "database", "package.json"));
}

if (hasBackend(inRepo)) {
  console.log("[link-orakly-backend] orakly-backend/ ready");
  process.exit(0);
}

if (hasBackend(sibling)) {
  try {
    symlinkSync(sibling, inRepo, "junction");
    console.log("[link-orakly-backend] linked orakly-backend/ → sibling repo");
    process.exit(0);
  } catch (e) {
    console.warn("[link-orakly-backend] junction failed:", e);
  }
}

if (process.env.VERCEL === "1" || process.env.CI === "true") {
  execSync("node scripts/ensure-backend-for-vercel.mjs", {
    cwd: frontendRoot,
    stdio: "inherit",
  });
  process.exit(0);
}

console.warn(
  "[link-orakly-backend] No backend found. Clone orakly-backend next to orakly-frontend, or run:\n" +
    "  node scripts/ensure-backend-for-vercel.mjs",
);
