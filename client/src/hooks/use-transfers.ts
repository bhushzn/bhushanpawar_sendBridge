"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { CONTRACT_ADDRESS } from "@/lib/stellar/config";
import {
  buildCreateTransfer,
  buildCancelTransfer,
  executeSimulatedCreateTransfer,
  executeSimulatedCancelTransfer,
} from "@/lib/stellar/contract";
import { getAccountInfo } from "@/lib/stellar/rpc";
import { signWithWallet, submitAndPoll } from "@/lib/stellar/transactions";
import { normalizeStellarError } from "@/lib/stellar/errors";
import { getCachedSession } from "@/lib/stellar/wallet/stellar-wallet";

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const transferStore = useTransferStore();
  const address = useWalletStore((s) => s.address);

  return useMutation({
    mutationFn: async (params: {
      recipient: string;
      sourceAsset: string;
      destAsset: string;
      sourceAmount: string;
      destAmount: string;
      exchangeRate: number;
      feeBps: number;
    }) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      transferStore.setTransactionStatus("building");
      transferStore.setTransactionError(null);

      const session = getCachedSession();
      const isDemo = session?.isDemo || !CONTRACT_ADDRESS;

      if (isDemo) {
        // Simulated execution with realistic step delays for UI feedback
        await new Promise((r) => setTimeout(r, 600));
        transferStore.setTransactionStatus("signing");
        await new Promise((r) => setTimeout(r, 800));
        transferStore.setTransactionStatus("submitting");
        await new Promise((r) => setTimeout(r, 1000));

        const sourceMicro = BigInt(
          Math.round(parseFloat(params.sourceAmount) * 1_000_000),
        ).toString();
        const destMicro = params.destAmount;

        const result = await executeSimulatedCreateTransfer({
          sender: address,
          recipient: params.recipient,
          sourceAsset: params.sourceAsset,
          destAsset: params.destAsset,
          sourceAmount: sourceMicro,
          destAmount: destMicro,
          exchangeRate: params.exchangeRate,
          feeBps: params.feeBps,
        });

        transferStore.setCurrentTransferId(result.id);
        transferStore.setTransactionHash(result.hash);
        transferStore.setTransactionStatus("success");

        queryClient.invalidateQueries({ queryKey: ["transferCount"] });
        queryClient.invalidateQueries({ queryKey: ["recentTransfers"] });
        queryClient.invalidateQueries({ queryKey: ["transfer", result.id] });

        return {
          id: result.id,
          hash: result.hash,
          status: "SUCCESS",
        };
      }

      try {
        const account = await getAccountInfo(address);

        const sourceAmountBigInt = BigInt(
          Math.round(parseFloat(params.sourceAmount) * 1_000_000),
        );
        const destAmountBigInt = BigInt(
          Math.round(parseFloat(params.destAmount) * 1_000_000),
        );

        const tx = await buildCreateTransfer(
          CONTRACT_ADDRESS,
          address,
          params.recipient,
          params.sourceAsset,
          params.destAsset,
          sourceAmountBigInt,
          destAmountBigInt,
          params.exchangeRate,
          params.feeBps,
          account,
        );

        transferStore.setTransactionStatus("signing");
        const signedXdr = await signWithWallet(tx);

        transferStore.setTransactionStatus("submitting");
        const result = await submitAndPoll(signedXdr);

        transferStore.setTransactionStatus("success");
        transferStore.setTransactionHash(result.hash);

        queryClient.invalidateQueries({ queryKey: ["transferCount"] });
        queryClient.invalidateQueries({ queryKey: ["recentTransfers"] });

        return {
          hash: result.hash,
          status: result.status,
        };
      } catch (err) {
        const message = normalizeStellarError(err);
        transferStore.setTransactionStatus("error");
        transferStore.setTransactionError(message);
        throw err;
      }
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  const transferStore = useTransferStore();
  const address = useWalletStore((s) => s.address);

  return useMutation({
    mutationFn: async (params: { transferId: number }) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      transferStore.setTransactionStatus("building");
      transferStore.setTransactionError(null);

      const session = getCachedSession();
      const isDemo = session?.isDemo || !CONTRACT_ADDRESS;

      if (isDemo) {
        await new Promise((r) => setTimeout(r, 500));
        transferStore.setTransactionStatus("signing");
        await new Promise((r) => setTimeout(r, 600));
        transferStore.setTransactionStatus("submitting");
        await new Promise((r) => setTimeout(r, 800));

        const result = await executeSimulatedCancelTransfer(
          params.transferId,
          address,
        );

        transferStore.setTransactionStatus("success");
        transferStore.setTransactionHash(result.hash);

        queryClient.invalidateQueries({
          queryKey: ["transfer", params.transferId],
        });
        queryClient.invalidateQueries({
          queryKey: ["transferStatus", params.transferId],
        });
        queryClient.invalidateQueries({ queryKey: ["recentTransfers"] });

        return {
          hash: result.hash,
          status: "SUCCESS",
        };
      }

      try {
        const account = await getAccountInfo(address);

        const tx = await buildCancelTransfer(
          CONTRACT_ADDRESS,
          address,
          params.transferId,
          account,
        );

        transferStore.setTransactionStatus("signing");
        const signedXdr = await signWithWallet(tx);

        transferStore.setTransactionStatus("submitting");
        const result = await submitAndPoll(signedXdr);

        transferStore.setTransactionStatus("success");
        transferStore.setTransactionHash(result.hash);

        queryClient.invalidateQueries({
          queryKey: ["transfer", params.transferId],
        });
        queryClient.invalidateQueries({
          queryKey: ["transferStatus", params.transferId],
        });
        queryClient.invalidateQueries({ queryKey: ["recentTransfers"] });

        return {
          hash: result.hash,
          status: result.status,
        };
      } catch (err) {
        const message = normalizeStellarError(err);
        transferStore.setTransactionStatus("error");
        transferStore.setTransactionError(message);
        throw err;
      }
    },
  });
}

