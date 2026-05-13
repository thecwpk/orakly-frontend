import { BaseError, ContractFunctionRevertedError } from "viem";

export function formatChainTradeError(error: unknown): string {
  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      return revert.shortMessage || revert.message;
    }
    return error.shortMessage || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Transaction failed";
}
