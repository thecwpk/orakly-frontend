/**
 * Clone orakly-backend into ./orakly-backend for Vercel (private repo needs GITHUB_TOKEN).
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..");
const inRepoBackend = join(frontendRoot, "orakly-backend");
const siblingBackend = join(frontendRoot, "..", "orakly-backend");
const defaultRepo = "thecwpk/orakly-backend";
const ref = process.env.ORAKLY_BACKEND_REF?.trim() || "main";

function hasBackend(path) {
  return existsSync(join(path, "packages", "database", "package.json"));
}

function fail(message) {
  console.error(`[ensure-backend] ${message}`);
  process.exit(1);
}

if (hasBackend(siblingBackend) || hasBackend(inRepoBackend)) {
  console.log("[ensure-backend] backend packages found — skip clone");
  process.exit(0);
}

const token =
  process.env.ORAKLY_BACKEND_GITHUB_TOKEN?.trim() ||
  process.env.GITHUB_TOKEN?.trim() ||
  process.env.GH_TOKEN?.trim();

const repoSlug =
  process.env.ORAKLY_BACKEND_REPO?.trim()?.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "") ||
  defaultRepo;

const cloneUrl = token
  ? `https://x-access-token:${token}@github.com/${repoSlug}.git`
  : `https://github.com/${repoSlug}.git`;

console.log(`[ensure-backend] cloning github.com/${repoSlug} @ ${ref} → orakly-backend/`);

try {
  execSync(
    `git clone --depth 1 --single-branch --branch ${ref} ${cloneUrl} orakly-backend`,
    { cwd: frontendRoot, stdio: "inherit", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
  );
} catch (e) {
  fail(
    token
      ? `git clone failed. Check ORAKLY_BACKEND_GITHUB_TOKEN / branch "${ref}".`
      : `git clone failed — ${defaultRepo} is private. Add GITHUB_TOKEN to Vercel (repo read) or make the backend repo public.`,
  );
}

if (!hasBackend(inRepoBackend)) {
  fail("clone finished but packages/database not found — wrong branch or repo?");
}

console.log("[ensure-backend] ok");
