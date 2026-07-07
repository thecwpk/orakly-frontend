import process from "node:process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

function trimEnv(name) {
  return process.env[name]?.trim() ?? "";
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo database package (Railway `DATABASE_URL` is set on Vercel, not in this file). */
const databaseEnvPath = path.resolve(__dirname, "../../packages/database/.env");

/** Prefer OS / hosting env; otherwise reuse the Prisma package `.env` for local dev. */
if (!process.env.DATABASE_URL && existsSync(databaseEnvPath)) {
  loadEnv({ path: databaseEnvPath });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/welcome", destination: "/dapp", permanent: true }];
  },
  async rewrites() {
    const upstream = trimEnv("REALTIME_UPSTREAM_URL").replace(/\/$/, "");
    if (!upstream) return [];
    return [
      {
        source: "/socket.io/:path*",
        destination: `${upstream}/socket.io/:path*`,
      },
    ];
  },
  poweredByHeader: false,
  compress: true,
  transpilePackages: [
    "@orakly/realtime-protocol",
    "@orakly/crypto-integrations",
    "@orakly/database",
    "@orakly/jobs",
    "@orakly/narratives",
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
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
