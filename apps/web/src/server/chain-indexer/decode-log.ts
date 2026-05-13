import "server-only";

import type { Hex, Log } from "viem";
import { decodeEventLog } from "viem";
import type { Prisma } from "@prisma/client";

import { chainIndexerEventsAbi } from "./abi";

function payloadReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

export function encodeIndexerPayload(
  decodedArgs: Record<string, unknown> | undefined,
  topics: readonly `0x${string}`[],
): Prisma.InputJsonValue {
  const raw = {
    ...(decodedArgs ?? {}),
    topicsHex: [...topics],
  };
  return JSON.parse(JSON.stringify(raw, payloadReplacer)) as Prisma.InputJsonValue;
}

export type DecodedIndexerLog = {
  eventName: string;
  payload: Prisma.InputJsonValue;
};

export function decodeIndexerLog(log: Log): DecodedIndexerLog {
  try {
    const decoded = decodeEventLog({
      abi: chainIndexerEventsAbi,
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: false,
    });
    const args = decoded.args as Record<string, unknown> | undefined;
    return {
      eventName: decoded.eventName,
      payload: encodeIndexerPayload(args, log.topics),
    };
  } catch {
    return {
      eventName: "UNKNOWN",
      payload: encodeIndexerPayload(undefined, log.topics),
    };
  }
}
