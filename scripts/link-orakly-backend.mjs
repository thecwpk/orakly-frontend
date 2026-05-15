/**
 * Ensures `orakly-frontend/orakly-backend` exists for `file:../../orakly-backend` deps.
 */
import { existsSync, symlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const inRepo = join(frontendRoot, "orakly-backend");
const sibling = join(frontendRoot, "..", "orakly-backend");

function hasBackend(path) {
  return existsSync(join(path, "packages", "database", "package.json"));
}

function fail(msg) {
  console.error(`[link-orakly-backend] ${msg}`);
  process.exit(1);
}

if (hasBackend(inRepo)) {
  console.log("[link-orakly-backend] orakly-backend/ ready");
  process.exit(0);
}

if (hasBackend(sibling)) {
  try {
    symlinkSync(sibling, inRepo, "dir");
    console.log("[link-orakly-backend] symlinked orakly-backend/ → sibling repo");
    process.exit(0);
  } catch {
    try {
      symlinkSync(sibling, inRepo, "junction");
      console.log("[link-orakly-backend] junction orakly-backend/ → sibling repo");
      process.exit(0);
    } catch (e) {
      console.warn("[link-orakly-backend] symlink failed:", e.message);
    }
  }
}

const onCi =
  process.env.VERCEL === "1" ||
  process.env.VERCEL === "true" ||
  process.env.CI === "true" ||
  process.env.CI === "1";

if (onCi) {
  execSync("node scripts/ensure-backend-for-vercel.mjs", {
    cwd: frontendRoot,
    stdio: "inherit",
  });
  if (!hasBackend(inRepo)) {
    fail("backend still missing after clone — set GITHUB_TOKEN on Vercel for private thecwpk/orakly-backend");
  }
  console.log("[link-orakly-backend] orakly-backend/ ready (cloned)");
  process.exit(0);
}

fail(
  "No orakly-backend found. Place it next to orakly-frontend or deploy on Vercel with GITHUB_TOKEN.",
);
