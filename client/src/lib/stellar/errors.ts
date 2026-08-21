export class WalletNotConnectedError extends Error {
  constructor(message = "Wallet is not connected. Please connect your wallet.") {
    super(message);
    this.name = "WalletNotConnectedError";
  }
}

export class WalletRejectedError extends Error {
  constructor(message = "Transaction was rejected by the wallet.") {
    super(message);
    this.name = "WalletRejectedError";
  }
}

export class WalletNotInstalledError extends Error {
  constructor(walletName = "Freighter") {
    super(`${walletName} wallet extension is not installed.`);
    this.name = "WalletNotInstalledError";
  }
}

export class WrongNetworkError extends Error {
  constructor(expected: string, actual: string) {
    super(`Wrong network: expected ${expected}, got ${actual}`);
    this.name = "WrongNetworkError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message = "Insufficient balance for this transaction.") {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationError";
  }
}

export class TransactionFailedError extends Error {
  public resultXdr?: string;

  constructor(message: string, resultXdr?: string) {
    super(message);
    this.name = "TransactionFailedError";
    this.resultXdr = resultXdr;
  }
}

export class RpcError extends Error {
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "RpcError";
    this.code = code;
  }
}

export class ContractError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ContractError";
    this.code = code;
  }
}

export class TimeoutError extends Error {
  constructor(message = "Transaction timed out after maximum attempts.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class UnknownStellarError extends Error {
  constructor(message = "An unknown error occurred.") {
    super(message);
    this.name = "UnknownStellarError";
  }
}

export function normalizeStellarError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotFoundError" || error.message?.includes("User declined")) {
      return "Transaction was rejected by the user.";
    }
    if (error.message?.includes("freighter") || error.message?.includes("Freighter")) {
      return "Please install or unlock the Freighter wallet extension.";
    }
    if (error.message?.includes("soroban") || error.message?.includes("simulate")) {
      return "Contract simulation failed. Please check your transaction parameters.";
    }
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      return "The request timed out. Please try again.";
    }
    if (error.message?.includes("network") || error.message?.includes("Network")) {
      return "Network error. Please check your connection and try again.";
    }
    if (error.message?.includes("insufficient")) {
      return "Insufficient funds to complete this transaction.";
    }
    return error.message || "An unexpected error occurred.";
  }
  return "An unexpected error occurred.";
}
