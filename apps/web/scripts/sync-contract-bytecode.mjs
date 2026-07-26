#!/usr/bin/env node
/**
 * Write Market / MarketFactory creation bytecode into the frontend.
 * Run after: cd orakly-market/packages/contracts && forge build
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const contractsOut = path.resolve(
  webRoot,
  "../../../orakly-market/packages/contracts/out",
);
const destDir = path.join(webRoot, "src/features/chain-trading/bytecode");

function loadBytecode(name) {
  const p = path.join(contractsOut, `${name}.sol`, `${name}.json`);
  if (!existsSync(p)) {
    throw new Error(`Missing ${p} — run forge build in packages/contracts`);
  }
  const json = JSON.parse(readFileSync(p, "utf8"));
  const bytecode = json?.bytecode?.object;
  if (!bytecode || !bytecode.startsWith("0x")) {
    throw new Error(`No bytecode in ${p}`);
  }
  return bytecode;
}

mkdirSync(destDir, { recursive: true });

const market = loadBytecode("Market");
const factory = loadBytecode("MarketFactory");

writeFileSync(
  path.join(destDir, "market.ts"),
  `/** Auto-generated from forge build — do not edit. */\nexport const marketBytecode = "${market}" as \`0x\${string}\`;\n`,
  "utf8",
);
writeFileSync(
  path.join(destDir, "market-factory.ts"),
  `/** Auto-generated from forge build — do not edit. */\nexport const marketFactoryBytecode = "${factory}" as \`0x\${string}\`;\n`,
  "utf8",
);

console.log(`[sync-bytecode] Market ${market.length} chars`);
console.log(`[sync-bytecode] MarketFactory ${factory.length} chars`);
