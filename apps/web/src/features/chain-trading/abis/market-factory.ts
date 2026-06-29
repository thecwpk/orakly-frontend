import type { Abi } from "viem";

export const marketFactoryAbi = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateral", type: "address" },
      { name: "treasury", type: "address" },
      { name: "optimisticOracle", type: "address" },
      { name: "feeBps", type: "uint16" },
      { name: "question", type: "string" },
      { name: "resolutionSource", type: "string" },
      { name: "category", type: "uint8" },
      { name: "endTime", type: "uint256" },
      { name: "seedLiquidity", type: "uint256" },
      { name: "assertionReward", type: "uint256" },
      { name: "requiredBond", type: "uint256" },
      { name: "assertionLiveness", type: "uint64" },
    ],
    outputs: [{ name: "market", type: "address" }],
  },
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "market", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "question", type: "string", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
      { name: "category", type: "uint8", indexed: false },
      { name: "seedLiquidity", type: "uint256", indexed: false },
      { name: "assertionReward", type: "uint256", indexed: false },
    ],
  },
] as const satisfies Abi;
