/**
 * Vercel only clones orakly-frontend. Clones backend into ./orakly-backend when missing.
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const inRepoBackend = join(frontendRoot, "orakly-backend");
const siblingBackend = join(frontendRoot, "..", "orakly-backend");
const repo =
  process.env.ORAKLY_BACKEND_REPO?.trim() ||
  "https://github.com/thecwpk/orakly-backend.git";
const ref = process.env.ORAKLY_BACKEND_REF?.trim() || "main";

function hasBackend(path) {
  return existsSync(join(path, "packages", "database", "package.json"));
}

if (hasBackend(siblingBackend) || hasBackend(inRepoBackend)) {
  console.log("[ensure-backend] backend packages found — skip clone");
  process.exit(0);
}

console.log(`[ensure-backend] cloning ${repo} @ ${ref} → orakly-backend/`);
execSync(`git clone --depth 1 --branch ${ref} ${repo} orakly-backend`, {
  cwd: frontendRoot,
  stdio: "inherit",
});
