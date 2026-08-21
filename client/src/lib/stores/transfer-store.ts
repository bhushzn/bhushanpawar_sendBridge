import { create } from "zustand";
import { EXCHANGE_RATE_PRECISION, FEE_BPS_DEFAULT } from "@/lib/stellar/config";

export interface TransferState {
  sourceAsset: string;
  destAsset: string;
  sourceAmount: string;
  recipientAddress: string;

  exchangeRate: number;
  feeBps: number;

  kycVerified: boolean;
  kycHash: string;

  currentTransferId: number | null;
  transactionHash: string | null;
  transactionStatus:
    | "idle"
    | "building"
    | "signing"
    | "submitting"
    | "polling"
    | "success"
    | "error";
  transactionError: string | null;

  setSourceAsset: (asset: string) => void;
  setDestAsset: (asset: string) => void;
  setSourceAmount: (amount: string) => void;
  setRecipientAddress: (addr: string) => void;
  setExchangeRate: (rate: number) => void;
  setFeeBps: (bps: number) => void;
  setKycVerified: (verified: boolean, hash: string) => void;
  setTransactionStatus: (
    status: TransferState["transactionStatus"],
  ) => void;
  setTransactionHash: (hash: string | null) => void;
  setCurrentTransferId: (id: number | null) => void;
  setTransactionError: (error: string | null) => void;
  resetForm: () => void;
  resetTransaction: () => void;
  getDestAmount: () => string;
  getFeeAmount: () => string;
}

const INITIAL_STATE = {
  sourceAsset: "SB_INR",
  destAsset: "SB_USD",
  sourceAmount: "",
  recipientAddress: "",
  exchangeRate: 0,
  feeBps: FEE_BPS_DEFAULT,
  kycVerified: false,
  kycHash: "",
  currentTransferId: null,
  transactionHash: null,
  transactionStatus: "idle" as const,
  transactionError: null,
};

export const useTransferStore = create<TransferState>((set, get) => ({
  ...INITIAL_STATE,

  setSourceAsset: (asset: string) => set({ sourceAsset: asset }),
  setDestAsset: (asset: string) => set({ destAsset: asset }),
  setSourceAmount: (amount: string) => set({ sourceAmount: amount }),
  setRecipientAddress: (addr: string) => set({ recipientAddress: addr }),
  setExchangeRate: (rate: number) => set({ exchangeRate: rate }),
  setFeeBps: (bps: number) => set({ feeBps: bps }),
  setKycVerified: (verified: boolean, hash: string) =>
    set({ kycVerified: verified, kycHash: hash }),
  setTransactionStatus: (
    status: TransferState["transactionStatus"],
  ) => set({ transactionStatus: status }),
  setTransactionHash: (hash: string | null) => set({ transactionHash: hash }),
  setCurrentTransferId: (id: number | null) => set({ currentTransferId: id }),
  setTransactionError: (error: string | null) =>
    set({ transactionError: error }),

  resetForm: () =>
    set({
      sourceAsset: INITIAL_STATE.sourceAsset,
      destAsset: INITIAL_STATE.destAsset,
      sourceAmount: INITIAL_STATE.sourceAmount,
      recipientAddress: INITIAL_STATE.recipientAddress,
    }),

  resetTransaction: () =>
    set({
      currentTransferId: null,
      transactionHash: null,
      transactionStatus: "idle",
      transactionError: null,
    }),

  getDestAmount: () => {
    const { sourceAmount, exchangeRate, feeBps } = get();
    if (!sourceAmount || !exchangeRate) return "0";

    const sourceMicro = BigInt(
      Math.round(parseFloat(sourceAmount) * 1_000_000),
    );
    const rate = BigInt(Math.round(exchangeRate * EXCHANGE_RATE_PRECISION));
    const grossDest =
      (sourceMicro * rate) / BigInt(EXCHANGE_RATE_PRECISION);
    const feeDeduction = (grossDest * BigInt(feeBps)) / BigInt(10_000);
    const netDest = grossDest - feeDeduction;

    return netDest > BigInt(0) ? netDest.toString() : "0";
  },

  getFeeAmount: () => {
    const { sourceAmount, exchangeRate, feeBps } = get();
    if (!sourceAmount || !exchangeRate) return "0";

    const sourceMicro = BigInt(
      Math.round(parseFloat(sourceAmount) * 1_000_000),
    );
    const rate = BigInt(Math.round(exchangeRate * EXCHANGE_RATE_PRECISION));
    const grossDest =
      (sourceMicro * rate) / BigInt(EXCHANGE_RATE_PRECISION);
    const feeDeduction = (grossDest * BigInt(feeBps)) / BigInt(10_000);

    return feeDeduction > BigInt(0) ? feeDeduction.toString() : "0";
  },
}));

