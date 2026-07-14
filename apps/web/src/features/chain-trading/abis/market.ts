/** Fallback ABI from orakly-market Market.sol — run sync-contract-abis.mjs after forge build. */
import type { Abi } from "viem";

export const marketAbi: Abi = [
  {
    type: "function",
    name: "previewBuyYes",
    stateMutability: "view",
    inputs: [{ name: "netCollateral", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewBuyNo",
    stateMutability: "view",
    inputs: [{ name: "netCollateral", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "previewSellYesOut",
    stateMutability: "view",
    inputs: [{ name: "yesToSell", type: "uint256" }],
    outputs: [
      { name: "collateralOut", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "previewSellNoOut",
    stateMutability: "view",
    inputs: [{ name: "noToSell", type: "uint256" }],
    outputs: [
      { name: "collateralOut", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint16" }],
  },
  {
    type: "function",
    name: "yesToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "noToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "buyYes",
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "minYesOut", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyNo",
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "minNoOut", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sellYes",
    inputs: [
      { name: "minYesToSell", type: "uint256" },
      { name: "minUsdcOut", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sellNo",
    inputs: [
      { name: "minNoToSell", type: "uint256" },
      { name: "minUsdcOut", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BoughtYes",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateralIn", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "yesOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BoughtNo",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "collateralIn", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "noOut", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "claimWinnings",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "event",
    name: "MarketResolved",
    inputs: [{ name: "assertedOutcomeId", type: "bytes32", indexed: false }],
  },
] as const;
