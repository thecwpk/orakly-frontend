/** Auto-generated from orakly-market/packages/contracts — do not edit by hand. */
import type { Abi } from "viem";

export const marketFactoryAbi: Abi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_marketImplementation",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMarket",
    "inputs": [
      {
        "name": "collateral",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "optimisticOracle",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "feeBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "question",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "resolutionSource",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "category",
        "type": "uint8",
        "internalType": "enum Market.Category"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "seedLiquidity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "assertionReward",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "requiredBond",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "assertionLiveness",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "market",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMarkets",
    "inputs": [
      {
        "name": "collateral",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "optimisticOracle",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "feeBps",
        "type": "uint16[]",
        "internalType": "uint16[]"
      },
      {
        "name": "questions",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "resolutionSources",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "categories",
        "type": "uint8[]",
        "internalType": "enum Market.Category[]"
      },
      {
        "name": "endTimes",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "seedLiquidities",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "assertionRewards",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "requiredBonds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "assertionLiveness",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "markets",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "marketImplementation",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "MarketCreated",
    "inputs": [
      {
        "name": "market",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "creator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "question",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "category",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum Market.Category"
      },
      {
        "name": "seedLiquidity",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "assertionReward",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressInsufficientBalance",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC1167FailedCreateClone",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedInnerCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
