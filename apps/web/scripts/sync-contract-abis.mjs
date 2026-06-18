#!/usr/bin/env node
/**
 * Sync Foundry artifacts → frontend TypeScript ABI modules.
 * Run after: cd orakly-market/packages/contracts && forge build
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const contractsOut = path.resolve(
  webRoot,
  "../../../orakly-market/packages/contracts/out",
);

function loadArtifact(name) {
  const p = path.join(contractsOut, `${name}.sol`, `${name}.json`);
  if (!existsSync(p)) {
    console.warn(`[sync-abis] missing ${p} — run forge build in packages/contracts`);
    return null;
  }
  const json = JSON.parse(readFileSync(p, "utf8"));
  return json.abi;
}

function writeTsModule(outPath, exportName, abi, header) {
  const body = `${header}
import type { Abi } from "viem";

export const ${exportName}: Abi = ${JSON.stringify(abi, null, 2)} as const;
`;
  writeFileSync(outPath, body, "utf8");
  console.log(`[sync-abis] wrote ${outPath}`);
}

const marketAbi = loadArtifact("Market");
const factoryAbi = loadArtifact("MarketFactory");

if (marketAbi) {
  writeTsModule(
    path.join(webRoot, "src/features/chain-trading/abis/market.ts"),
    "marketAbi",
    marketAbi,
    "/** Auto-generated from orakly-market/packages/contracts — do not edit by hand. */",
  );
}

if (factoryAbi) {
  writeTsModule(
    path.join(webRoot, "src/server/chain-indexer/abi.ts"),
    "chainIndexerEventsAbi",
    factoryAbi.filter(
      (item) => item.type === "event" || (item.type === "function" && item.name === "createMarket"),
    ),
    "/** Auto-generated factory events — do not edit by hand. */",
  );
}

if (!marketAbi && !factoryAbi) {
  console.log("[sync-abis] No artifacts found; using committed fallback ABIs.");
  process.exit(0);
}
