import { create } from "zustand";
import { rpc } from "@stellar/stellar-sdk";
import {
  connectWallet,
  disconnectWallet,
  DEMO_ACCOUNTS,
} from "@/lib/stellar/wallet/stellar-wallet";
import { RPC_URL } from "@/lib/stellar/config";

interface WalletState {
  isConnected: boolean;
  address: string;
  network: string;
  walletId: string;
  role: string;
  accountName: string;
  isDemo: boolean;
  xlmBalance: string;
  isLoading: boolean;
  error: string | null;
  connect: (walletId?: string, demoAccountId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setAddress: (address: string) => void;
  setNetwork: (network: string) => void;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: "",
  network: "",
  walletId: "",
  role: "User",
  accountName: "",
  isDemo: false,
  xlmBalance: "0",
  isLoading: false,
  error: null,

  connect: async (walletId?: string, demoAccountId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await connectWallet(walletId, demoAccountId);
      
      let balance = "100.00";
      if (session.isDemo) {
        const demoAcc = DEMO_ACCOUNTS.find((a) => a.address === session.address);
        balance = demoAcc ? demoAcc.initialBalance : "1000.00";
      }

      set({
        isConnected: true,
        address: session.address,
        network: session.network,
        walletId: session.walletId,
        role: session.role || "User",
        accountName: session.accountName || "",
        isDemo: Boolean(session.isDemo),
        xlmBalance: balance,
        isLoading: false,
      });

      if (!session.isDemo) {
        get().refreshBalance();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await disconnectWallet();
      set({
        isConnected: false,
        address: "",
        network: "",
        walletId: "",
        role: "User",
        accountName: "",
        isDemo: false,
        xlmBalance: "0",
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect wallet";
      set({ isLoading: false, error: message });
    }
  },

  refreshBalance: async () => {
    const { address, isConnected, isDemo } = get();
    if (!isConnected || !address || isDemo) return;

    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (res.ok) {
        const data = (await res.json()) as { balances?: Array<{ asset_type: string; balance: string }> };
        const xlmAsset = data.balances?.find((b) => b.asset_type === "native");
        if (xlmAsset) {
          set({ xlmBalance: xlmAsset.balance });
        }
      }
    } catch {
      // Silently fail - balance refresh is non-critical
    }
  },


  setAddress: (address: string) => set({ address }),
  setNetwork: (network: string) => set({ network }),
  clearError: () => set({ error: null }),
}));

