import "server-only";

import { prisma } from "@orakly/database";
import type { Prisma } from "@prisma/client";
import { createPublicClient, http, type PublicClient } from "viem";

import { getChainIndexerConfig, indexerChain } from "./config";
import { decodeIndexerLog } from "./decode-log";

export type ChainIndexerRunResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true;
      skipped: false;
      chainId: number;
      fromBlock: string;
      toBlock: string;
      logsFetched: number;
      eventsWritten: number;
      rewound: boolean;
      rewoundFromBlock?: string;
    }
  | { ok: false; error: string };

type CheckpointRow = {
  chainId: number;
  lastCommittedBlock: bigint;
  lastCommittedHash: string;
};

async function ensureCheckpoint(
  client: PublicClient,
  chainId: number,
  bootstrapBelowTip: bigint,
): Promise<CheckpointRow> {
  const existing = await prisma.blockchainIndexerCheckpoint.findUnique({
    where: { chainId },
  });
  if (existing) {
    return {
      chainId: existing.chainId,
      lastCommittedBlock: existing.lastCommittedBlock,
      lastCommittedHash: existing.lastCommittedHash,
    };
  }

  const tip = await client.getBlockNumber();
  const anchorBn =
    tip > bootstrapBelowTip ? tip - bootstrapBelowTip : 1n;
  const anchorBlock = await client.getBlock({ blockNumber: anchorBn });

  const created = await prisma.blockchainIndexerCheckpoint.create({
    data: {
      chainId,
      lastCommittedBlock: anchorBn,
      lastCommittedHash: anchorBlock.hash,
    },
  });

  return {
    chainId: created.chainId,
    lastCommittedBlock: created.lastCommittedBlock,
    lastCommittedHash: created.lastCommittedHash,
  };
}

type SlimHeader = {
  number: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
};

async function fetchHeadersInclusive(
  client: PublicClient,
  from: bigint,
  to: bigint,
): Promise<SlimHeader[]> {
  const batchSize = 40;
  const headers: SlimHeader[] = [];
  let cursor = from;
  while (cursor <= to) {
    const sliceEnd =
      cursor + BigInt(batchSize - 1) > to ? to : cursor + BigInt(batchSize - 1);
    const batch: Promise<SlimHeader>[] = [];
    for (let bn = cursor; bn <= sliceEnd; bn++) {
      batch.push(
        client.getBlock({ blockNumber: bn }).then((b) => ({
          number: b.number!,
          hash: b.hash,
          parentHash: b.parentHash,
        })),
      );
    }
    headers.push(...(await Promise.all(batch)));
    cursor = sliceEnd + 1n;
  }
  return headers;
}

function verifyParentChain(
  headers: SlimHeader[],
  expectedParentOfFirst: string,
):
  | { ok: true }
  | { ok: false; mismatchIndex: number } {
  let parentHash = expectedParentOfFirst.toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!;
    if (h.parentHash.toLowerCase() !== parentHash) {
      return { ok: false, mismatchIndex: i };
    }
    parentHash = h.hash.toLowerCase();
  }
  return { ok: true };
}

async function rewindAfterReorg(
  client: PublicClient,
  chainId: number,
  firstInvalidBlockNumber: bigint,
): Promise<void> {
  await prisma.$transaction([
    prisma.blockchainEventLog.updateMany({
      where: {
        chainId,
        blockNumber: { gte: firstInvalidBlockNumber },
        orphaned: false,
      },
      data: { orphaned: true },
    }),
    prisma.blockchainCanonicalBlock.deleteMany({
      where: {
        chainId,
        blockNumber: { gte: firstInvalidBlockNumber },
      },
    }),
  ]);

  const rewindTo = firstInvalidBlockNumber - 1n;
  const anchor = await client.getBlock({
    blockNumber: rewindTo >= 0n ? rewindTo : 0n,
  });

  await prisma.blockchainIndexerCheckpoint.update({
    where: { chainId },
    data: {
      lastCommittedBlock: rewindTo >= 0n ? rewindTo : 0n,
      lastCommittedHash: anchor.hash,
    },
  });
}

/**
 * Background-safe indexer tick: fetches a capped block range behind `confirmations`,
 * verifies parent-hash continuity against the checkpoint, persists logs with unique
 * `(chainId, txHash, logIndex)`, advances checkpoint in one transaction, and rewinds
 * (+ marks orphaned) when the RPC canonical chain disagrees.
 */
export async function runChainIndexerSync(): Promise<ChainIndexerRunResult> {
  const config = getChainIndexerConfig();
  if (!config) {
    return {
      ok: true,
      skipped: true,
      reason: "CHAIN_INDEXER_DISABLED_OR_INCOMPLETE_ENV",
    };
  }

  const chain = indexerChain(config);
  const client = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });

  try {
    const checkpoint = await ensureCheckpoint(
      client,
      config.chainId,
      config.bootstrapBelowTip,
    );

    const tip = await client.getBlockNumber();
    const confirmations = BigInt(config.confirmations);
    const safeTip = tip > confirmations ? tip - confirmations : 0n;

    if (safeTip <= checkpoint.lastCommittedBlock) {
      return {
        ok: true,
        skipped: true,
        reason: "NO_NEW_CONFIRMED_BLOCKS",
      };
    }

    const fromBlock = checkpoint.lastCommittedBlock + 1n;
    let toBlock = fromBlock + BigInt(config.maxBlocksPerRun - 1);
    if (toBlock > safeTip) toBlock = safeTip;

    const headers = await fetchHeadersInclusive(client, fromBlock, toBlock);
    const chainOk = verifyParentChain(headers, checkpoint.lastCommittedHash);
    if (!chainOk.ok) {
      const badHeader = headers[chainOk.mismatchIndex]!;
      await rewindAfterReorg(client, config.chainId, badHeader.number);
      return {
        ok: true,
        skipped: false,
        chainId: config.chainId,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        logsFetched: 0,
        eventsWritten: 0,
        rewound: true,
        rewoundFromBlock: badHeader.number.toString(),
      };
    }

    const logs = await client.getLogs({
      address: config.contractAddresses,
      fromBlock,
      toBlock,
    });

    const canonicalRows = headers.map((h) => ({
      chainId: config.chainId,
      blockNumber: h.number,
      blockHash: h.hash,
    }));

    const eventRows: Prisma.BlockchainEventLogCreateManyInput[] = logs.map(
      (log) => {
        const decoded = decodeIndexerLog(log);
        return {
          chainId: config.chainId,
          blockNumber: log.blockNumber!,
          blockHash: log.blockHash!,
          transactionHash: log.transactionHash!,
          logIndex: Number(log.logIndex),
          contractAddress: log.address!.toLowerCase(),
          eventName: decoded.eventName,
          payload: decoded.payload,
          orphaned: false,
        };
      },
    );

    const last = headers[headers.length - 1]!;

    await prisma.$transaction(async (tx) => {
      await tx.blockchainCanonicalBlock.createMany({
        data: canonicalRows,
        skipDuplicates: true,
      });

      if (eventRows.length > 0) {
        await tx.blockchainEventLog.createMany({
          data: eventRows,
          skipDuplicates: true,
        });
      }

      await tx.blockchainIndexerCheckpoint.update({
        where: { chainId: config.chainId },
        data: {
          lastCommittedBlock: last.number,
          lastCommittedHash: last.hash,
        },
      });
    });

    const retentionFloor = last.number - BigInt(config.canonicalRetention);
    if (retentionFloor > 0n) {
      await prisma.blockchainCanonicalBlock.deleteMany({
        where: {
          chainId: config.chainId,
          blockNumber: { lt: retentionFloor },
        },
      });
    }

    return {
      ok: true,
      skipped: false,
      chainId: config.chainId,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      logsFetched: logs.length,
      eventsWritten: eventRows.length,
      rewound: false,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
