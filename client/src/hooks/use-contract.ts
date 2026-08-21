"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getExchangeRate,
  getFeeBps,
  isKycVerified,
  getTransfer,
  getTransferCount,
  getTransferStatus,
  getRecentTransfers,
  getOperator,
  getKyc,
} from "@/lib/stellar/contract";
import { CONTRACT_ADDRESS } from "@/lib/stellar/config";
import { useWalletStore } from "@/lib/stores/wallet-store";

export function useExchangeRate(sourceAsset: string, destAsset: string) {
  return useQuery({
    queryKey: ["exchangeRate", sourceAsset, destAsset],
    queryFn: () => getExchangeRate(CONTRACT_ADDRESS, sourceAsset, destAsset),
    enabled: !!sourceAsset && !!destAsset,
    staleTime: 30_000,
  });
}

export function useFeeBps() {
  return useQuery({
    queryKey: ["feeBps"],
    queryFn: () => getFeeBps(CONTRACT_ADDRESS),
    staleTime: 30_000,
  });
}

export function useOperator() {
  return useQuery({
    queryKey: ["operator"],
    queryFn: () => getOperator(CONTRACT_ADDRESS),
    staleTime: 30_000,
  });
}

export function useIsKycVerified(walletAddress: string) {
  return useQuery({
    queryKey: ["kyc", walletAddress],
    queryFn: () => isKycVerified(CONTRACT_ADDRESS, walletAddress),
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

export function useKycInfo(walletAddress: string) {
  return useQuery({
    queryKey: ["kycInfo", walletAddress],
    queryFn: () => getKyc(CONTRACT_ADDRESS, walletAddress),
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

export function useTransferCount() {
  return useQuery({
    queryKey: ["transferCount"],
    queryFn: () => getTransferCount(CONTRACT_ADDRESS),
    staleTime: 10_000,
  });
}

export function useTransfer(id: number) {
  return useQuery({
    queryKey: ["transfer", id],
    queryFn: () => getTransfer(CONTRACT_ADDRESS, id),
    enabled: typeof id === "number" && !isNaN(id) && id >= 0,
    staleTime: 10_000,
  });
}

export function useTransferStatus(id: number) {
  return useQuery({
    queryKey: ["transferStatus", id],
    queryFn: () => getTransferStatus(CONTRACT_ADDRESS, id),
    enabled: typeof id === "number" && !isNaN(id) && id >= 0,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}

export function useRecentTransfers(count = 20) {
  return useQuery({
    queryKey: ["recentTransfers", count],
    queryFn: () => getRecentTransfers(CONTRACT_ADDRESS, count),
    staleTime: 10_000,
  });
}

