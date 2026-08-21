import {
  rpc,
  Account,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { getServer } from "./network";
import { NETWORK_PASSPHRASE } from "./config";
import {
  SimulationError,
  RpcError,
  normalizeStellarError,
} from "./errors";

export async function simulateContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<rpc.Api.SimulateTransactionResponse> {
  try {
    const server = getServer();
    const { Contract } = await import("@stellar/stellar-sdk");
    const contract = new Contract(contractId);

    const account = await server.getAccount(contractId);
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(result)) {
      throw new SimulationError(
        result.error ?? "Simulation failed for contract call.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof SimulationError) throw error;
    throw new RpcError(normalizeStellarError(error));
  }
}

export async function prepareTransaction(
  xdrStr: string,
): Promise<rpc.Api.SimulateTransactionResponse> {
  try {
    const server = getServer();
    const tx = new Transaction(xdrStr, NETWORK_PASSPHRASE);
    const result = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(result)) {
      throw new SimulationError(
        result.error ?? "Transaction preparation failed.",
      );
    }

    return result;
  } catch (error) {
    if (error instanceof SimulationError) throw error;
    throw new RpcError(normalizeStellarError(error));
  }
}

export async function submitTransaction(
  signedXdr: string,
): Promise<rpc.Api.SendTransactionResponse> {
  try {
    const server = getServer();
    const tx = new Transaction(signedXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(tx);
    return result;
  } catch (error) {
    throw new RpcError(normalizeStellarError(error));
  }
}

export async function getTransactionStatus(
  hash: string,
): Promise<rpc.Api.GetTransactionResponse> {
  try {
    const server = getServer();
    const result = await server.getTransaction(hash);
    return result;
  } catch (error) {
    throw new RpcError(normalizeStellarError(error));
  }
}

export async function pollTransactionStatus(
  hash: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<rpc.Api.GetTransactionResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getTransactionStatus(hash);

    if (result.status === "SUCCESS" || result.status === "FAILED") {
      return result;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new RpcError(
    `Transaction polling timed out after ${maxAttempts} attempts for hash: ${hash}`,
  );
}

export async function getAccountInfo(
  publicKey: string,
): Promise<Account> {
  try {
    const server = getServer();
    return await server.getAccount(publicKey);
  } catch (error) {
    throw new RpcError(normalizeStellarError(error));
  }
}

export async function getContractData(
  contractId: string,
  key: xdr.ScVal,
): Promise<unknown> {
  try {
    const server = getServer();
    const result = await server.getContractData(contractId, key);
    return result;
  } catch (error) {
    throw new RpcError(normalizeStellarError(error));
  }
}
