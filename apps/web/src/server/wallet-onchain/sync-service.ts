import "server-only";

import { prisma } from "@orakly/database";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  zeroAddress,
  type PublicClient,
} from "viem";

import { testBnbChain } from "@/providers/web3/chains";

import {
  getWalletOnChainConfig,
  MULTICALL3_ADDRESS,
  type WalletOnChainRuntimeConfig,
} from "./config";
import { publishWalletOnChainSynced } from "./notify-portfolio";

export const NATIVE_TOKEN_SENTINEL = zeroAddress;

function indexerChain(cfg: WalletOnChainRuntimeConfig) {
  if (cfg.chainId === testBnbChain.id) {
    return {
      ...testBnbChain,
      rpcUrls: { default: { http: [cfg.rpcUrl] } },
    };
  }

  return {
    id: cfg.chainId,
    name: `wallet-sync-${cfg.chainId}`,
    nativeCurrency: {
      name: cfg.nativeSymbol,
      symbol: cfg.nativeSymbol,
      decimals: cfg.nativeDecimals,
    },
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
    contracts: {
      multicall3: {
        address: MULTICALL3_ADDRESS,
        blockCreated: 1,
      },
    },
  };
}

async function withinCooldown(
  userId: string,
  chainId: number,
  minMs: number,
): Promise<boolean> {
  const latest = await prisma.walletOnChainBalance.findFirst({
    where: { userId, chainId },
    orderBy: { syncedAt: "desc" },
    select: { syncedAt: true },
  });
  if (!latest) return false;
  return Date.now() - latest.syncedAt.getTime() < minMs;
}

export type WalletOnChainSyncResult =
  | {
      ok: true;
      skipped: true;
      reason: "NO_RPC_CONFIG" | "NO_WALLET_ADDRESS" | "COOLDOWN";
    }
  | {
      ok: true;
      skipped: false;
      chainId: number;
      blockNumber: string;
      rows: number;
    }
  | { ok: false; error: string };

async function fetchBalances(
  client: PublicClient,
  cfg: WalletOnChainRuntimeConfig,
  walletAddress: `0x${string}`,
  blockNumber: bigint,
) {
  const nativeWei = await client.getBalance({
    address: walletAddress,
    blockNumber,
  });

  const tokenContracts = cfg.tokens.map((t) => ({
    address: getAddress(t.address),
    abi: erc20Abi,
    functionName: "balanceOf" as const,
    args: [walletAddress],
  }));

  const tokenResults =
    tokenContracts.length === 0 ?
      []
    : await client.multicall({
        contracts: tokenContracts,
        allowFailure: true,
        blockNumber,
      });

  return { nativeWei, tokenResults };
}

export async function syncWalletOnChainBalances(params: {
  userId: string;
  force?: boolean;
}): Promise<WalletOnChainSyncResult> {
  const cfg = getWalletOnChainConfig();
  if (!cfg) {
    return { ok: true, skipped: true, reason: "NO_RPC_CONFIG" };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { walletAddress: true },
  });

  const rawAddr = user?.walletAddress?.trim();
  if (!rawAddr) {
    return { ok: true, skipped: true, reason: "NO_WALLET_ADDRESS" };
  }

  let walletAddress: `0x${string}`;
  try {
    walletAddress = getAddress(rawAddr);
  } catch {
    return { ok: false, error: "INVALID_USER_WALLET_ADDRESS" };
  }

  if (!params.force && (await withinCooldown(params.userId, cfg.chainId, cfg.minSyncIntervalMs))) {
    return { ok: true, skipped: true, reason: "COOLDOWN" };
  }

  try {
    const chain = indexerChain(cfg);
    const client = createPublicClient({
      chain,
      transport: http(cfg.rpcUrl),
    });

    const blockNumber = await client.getBlockNumber();
    const { nativeWei, tokenResults } = await fetchBalances(
      client,
      cfg,
      walletAddress,
      blockNumber,
    );

    const syncedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.walletOnChainBalance.upsert({
        where: {
          userId_chainId_tokenAddress: {
            userId: params.userId,
            chainId: cfg.chainId,
            tokenAddress: NATIVE_TOKEN_SENTINEL.toLowerCase(),
          },
        },
        create: {
          userId: params.userId,
          chainId: cfg.chainId,
          tokenAddress: NATIVE_TOKEN_SENTINEL.toLowerCase(),
          symbol: cfg.nativeSymbol,
          decimals: cfg.nativeDecimals,
          rawBalance: nativeWei.toString(),
          formattedBalance: formatUnits(nativeWei, cfg.nativeDecimals),
          syncedAt,
          blockNumber,
        },
        update: {
          symbol: cfg.nativeSymbol,
          decimals: cfg.nativeDecimals,
          rawBalance: nativeWei.toString(),
          formattedBalance: formatUnits(nativeWei, cfg.nativeDecimals),
          syncedAt,
          blockNumber,
        },
      });

      for (let i = 0; i < cfg.tokens.length; i++) {
        const tok = cfg.tokens[i]!;
        const res = tokenResults[i];
        let raw = 0n;
        if (res?.status === "success") {
          raw = res.result as bigint;
        }

        const addrNorm = tok.address.toLowerCase();
        await tx.walletOnChainBalance.upsert({
          where: {
            userId_chainId_tokenAddress: {
              userId: params.userId,
              chainId: cfg.chainId,
              tokenAddress: addrNorm,
            },
          },
          create: {
            userId: params.userId,
            chainId: cfg.chainId,
            tokenAddress: addrNorm,
            symbol: tok.symbol,
            decimals: tok.decimals,
            rawBalance: raw.toString(),
            formattedBalance: formatUnits(raw, tok.decimals),
            syncedAt,
            blockNumber,
          },
          update: {
            symbol: tok.symbol,
            decimals: tok.decimals,
            rawBalance: raw.toString(),
            formattedBalance: formatUnits(raw, tok.decimals),
            syncedAt,
            blockNumber,
          },
        });
      }
    });

    publishWalletOnChainSynced(params.userId);

    return {
      ok: true,
      skipped: false,
      chainId: cfg.chainId,
      blockNumber: blockNumber.toString(),
      rows: 1 + cfg.tokens.length,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
