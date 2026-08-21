import {
  rpc,
  TransactionBuilder,
  Transaction,
  Account,
  xdr,
} from "@stellar/stellar-sdk";
import { getServer } from "./network";
import { NETWORK_PASSPHRASE } from "./config";
import { signTransaction } from "./wallet/stellar-wallet";
import {
  submitTransaction,
  pollTransactionStatus,
} from "./rpc";
import {
  SimulationError,
  TransactionFailedError,
  TimeoutError,
} from "./errors";

export async function buildAndSimulate(
  account: Account,
  operations: xdr.Operation[],
): Promise<Transaction> {
  const server = getServer();

  let txBuilder = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const op of operations) {
    txBuilder = txBuilder.addOperation(op);
  }

  const builtTx = txBuilder.setTimeout(60).build();

  const simulated = await server.simulateTransaction(builtTx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new SimulationError(
      simulated.error ?? "Transaction simulation failed.",
    );
  }

  const successSim = simulated as rpc.Api.SimulateTransactionSuccessResponse;
  const assembled = rpc.assembleTransaction(builtTx, successSim);
  return assembled.build();
}

export async function signWithWallet(tx: Transaction): Promise<string> {
  const signedXdr = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  return signedXdr;
}

export async function submitAndPoll(
  signedXdr: string,
): Promise<{ hash: string; status: string; result?: unknown }> {
  const sendResult = await submitTransaction(signedXdr);
  const hash = sendResult.hash;

  if (sendResult.status === "ERROR") {
    throw new TransactionFailedError(
      "Transaction submission returned an error.",
      signedXdr,
    );
  }

  const pollResult = await pollTransactionStatus(hash, 30, 2000);

  if (pollResult.status === "SUCCESS") {
    const successResult =
      pollResult as rpc.Api.GetSuccessfulTransactionResponse;
    return {
      hash,
      status: "SUCCESS",
      result: successResult.resultXdr,
    };
  }

  if (pollResult.status === "FAILED") {
    throw new TransactionFailedError(
      "Transaction failed on-chain.",
      signedXdr,
    );
  }

  throw new TimeoutError(
    `Transaction did not confirm within polling window. Hash: ${hash}`,
  );
}

export async function executeContractTx(
  tx: Transaction,
): Promise<{ hash: string; status: string; result?: unknown }> {
  const signedXdr = await signWithWallet(tx);
  return submitAndPoll(signedXdr);
}
