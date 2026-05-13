import process from "node:process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Split-repo: sibling `orakly-backend`. Legacy: monorepo `packages/database`. */
const siblingBackendDbEnv = path.resolve(
  __dirname,
  "../../../orakly-backend/packages/database/.env",
);
const monorepoDbEnv = path.resolve(__dirname, "../../packages/database/.env");
const databaseEnvPath = existsSync(siblingBackendDbEnv)
  ? siblingBackendDbEnv
  : monorepoDbEnv;

/** Prefer OS / hosting env; otherwise reuse the Prisma package `.env` for local dev. */
if (!process.env.DATABASE_URL && existsSync(databaseEnvPath)) {
  loadEnv({ path: databaseEnvPath });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  transpilePackages: [
    "@orakly/realtime-protocol",
    "@orakly/crypto-integrations",
    "@orakly/database",
    "@orakly/types",
    "@orakly/utils",
    "@orakly/config",
    "@repo/ui",
    "@rainbow-me/rainbowkit",
    "wagmi",
    "@wagmi/core",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "async-storage-stub.js",
      ),
    };
    return config;
  },
};

export default nextConfig;
