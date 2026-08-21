"use client";

import { useEffect, useCallback } from "react";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { isWalletConnected } from "@/lib/stellar/wallet/stellar-wallet";
import { truncateAddress, formatAmount } from "@/lib/stellar/format";

export function useWallet() {
  const store = useWalletStore();

  useEffect(() => {
    async function checkExistingSession() {
      if (store.isConnected) return;

      try {
        const connected = await isWalletConnected();
        if (connected) {
          await store.connect();
        }
      } catch {
        // No existing session
      }
    }

    checkExistingSession();
  }, []);

  useEffect(() => {
    if (!store.isConnected || !store.address) return;

    const interval = setInterval(() => {
      store.refreshBalance();
    }, 15_000);

    return () => clearInterval(interval);
  }, [store.isConnected, store.address]);

  const isOnTestnet = useCallback(() => {
    return store.network.toLowerCase().includes("test");
  }, [store.network]);

  const shortAddress = store.address
    ? truncateAddress(store.address, 6)
    : "";

  const formattedBalance = formatAmount(store.xlmBalance);

  const networkOk = store.network
    ? isOnTestnet()
    : true;

  return {
    isConnected: store.isConnected,
    address: store.address,
    shortAddress,
    network: store.network,
    walletId: store.walletId,
    role: store.role,
    accountName: store.accountName,
    isDemo: store.isDemo,
    xlmBalance: store.xlmBalance,
    formattedBalance,
    isLoading: store.isLoading,
    error: store.error,
    isOnTestnet: isOnTestnet(),
    networkOk,
    connect: store.connect,
    disconnect: store.disconnect,
    refreshBalance: store.refreshBalance,
    clearError: store.clearError,
  };
}

