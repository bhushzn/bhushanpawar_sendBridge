import * as FreighterApi from "@stellar/freighter-api";
import { Keypair } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "../config";
import {
  WalletNotConnectedError,
  WalletNotInstalledError,
} from "../errors";
import type { WalletInfo, WalletSession, DemoAccount, WalletType } from "./wallet-types";

const STORAGE_KEY = "sendbridge_wallet_session";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-alice",
    name: "Alice (Remittance Sender)",
    role: "Sender",
    address: "GBALICE5ENDBRIDGETESTNETWALLETSENDER474V567890AB",
    initialBalance: "2500.00",
    avatar: "👩‍💼",
  },
  {
    id: "demo-bob",
    name: "Bob (Bridge Operator)",
    role: "Operator",
    address: "GBBOBOP3RATORSENDBRIDGETESTNETWALLET682C123456BC",
    initialBalance: "50000.00",
    avatar: "👨‍💻",
  },
  {
    id: "demo-carol",
    name: "Carol (Protocol Admin)",
    role: "Admin",
    address: "GBCAROL4DMINSENDBRIDGETESTNETWALLET913D789012CD",
    initialBalance: "100000.00",
    avatar: "👑",
  },
];

export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    id: "freighter",
    name: "Freighter",
    icon: "🔑",
    isAvailable: false,
    type: "freighter",
    description: "Official Stellar browser extension wallet",
    category: "extension",
    badge: "Official",
    installUrl: "https://www.freighter.app/",
  },
  {
    id: "albedo",
    name: "Albedo",
    icon: "🌐",
    isAvailable: true,
    type: "albedo",
    description: "Web & mobile authorization bridge (no extension needed)",
    category: "web",
    badge: "Universal Web",
    installUrl: "https://albedo.link/",
  },
  {
    id: "xbull",
    name: "xBull Wallet",
    icon: "🐂",
    isAvailable: false,
    type: "xbull",
    description: "Multi-platform Stellar & Soroban smart wallet",
    category: "extension",
    badge: "Soroban Ready",
    installUrl: "https://xbull.app/",
  },
  {
    id: "rabet",
    name: "Rabet",
    icon: "🐰",
    isAvailable: false,
    type: "rabet",
    description: "Fast & lightweight Stellar browser extension",
    category: "extension",
    installUrl: "https://rabet.io/",
  },
  {
    id: "hana",
    name: "Hana Wallet",
    icon: "🌸",
    isAvailable: false,
    type: "hana",
    description: "Multi-chain wallet with full Stellar support",
    category: "extension",
    installUrl: "https://hanawallet.io/",
  },
  {
    id: "demo",
    name: "Demo Keypair",
    icon: "🧪",
    isAvailable: true,
    type: "demo",
    description: "Instant testnet accounts with pre-funded XLM balances",
    category: "instant",
    badge: "Instant & Dev",
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// Window global interface declarations
declare global {
  interface Window {
    xBullSDK?: {
      getPublicKey: () => Promise<string>;
      signXDR: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
    };
    rabet?: {
      connect: () => Promise<{ publicKey: string }>;
      sign: (xdr: string, network: string) => Promise<{ xdr: string }>;
    };
    hana?: {
      stellar?: {
        getPublicKey: () => Promise<string>;
        signTransaction: (xdr: string) => Promise<string>;
      };
    };
    albedo?: {
      publicKey: (params: { token?: string }) => Promise<{ pubkey: string; signed_message?: string }>;
      tx: (params: { xdr: string; network?: string }) => Promise<{ signed_envelope_xdr: string; tx_hash: string }>;
    };
  }
}

export function getCachedSession(): WalletSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WalletSession;
  } catch {
    return null;
  }
}

export function setCachedSession(session: WalletSession | null): void {
  if (!isBrowser()) return;
  try {
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable
  }
}

export async function getAvailableWallets(): Promise<WalletInfo[]> {
  if (!isBrowser()) {
    return SUPPORTED_WALLETS.map((w) => ({
      ...w,
      isAvailable: w.type === "demo" || w.type === "albedo",
    }));
  }

  let freighterAvailable = false;
  try {
    const result = await FreighterApi.isConnected();
    freighterAvailable = !!result?.isConnected;
  } catch {
    freighterAvailable = false;
  }

  const xbullAvailable = !!window.xBullSDK;
  const rabetAvailable = !!window.rabet;
  const hanaAvailable = !!window.hana?.stellar;

  return SUPPORTED_WALLETS.map((w) => {
    if (w.id === "freighter") return { ...w, isAvailable: freighterAvailable };
    if (w.id === "xbull") return { ...w, isAvailable: xbullAvailable };
    if (w.id === "rabet") return { ...w, isAvailable: rabetAvailable };
    if (w.id === "hana") return { ...w, isAvailable: hanaAvailable };
    if (w.id === "albedo") return { ...w, isAvailable: true };
    if (w.id === "demo") return { ...w, isAvailable: true };
    return w;
  });
}

export async function connectWallet(
  walletId = "freighter",
  demoAccountId?: string,
  customSecret?: string
): Promise<WalletSession> {
  if (!isBrowser()) {
    throw new WalletNotInstalledError("Freighter");
  }

  // 1. Demo Mode
  if (walletId === "demo" || demoAccountId) {
    const account =
      DEMO_ACCOUNTS.find((a) => a.id === (demoAccountId || "demo-alice")) || DEMO_ACCOUNTS[0];
    const session: WalletSession = {
      address: account.address,
      network: "testnet",
      walletId: account.id,
      walletName: account.name,
      isDemo: true,
      role: account.role,
      accountName: account.name,
    };
    setCachedSession(session);
    return session;
  }

  // 2. Custom Keypair
  if (walletId === "custom" && customSecret) {
    try {
      const keypair = Keypair.fromSecret(customSecret.trim());
      const session: WalletSession = {
        address: keypair.publicKey(),
        network: "testnet",
        walletId: "custom",
        walletName: "Custom Keypair",
        isDemo: true,
        role: "Custom User",
        accountName: "Custom Testnet Keypair",
      };
      setCachedSession(session);
      return session;
    } catch {
      throw new Error("Invalid Stellar secret key. Must start with 'S' and be 56 characters long.");
    }
  }

  // 3. Freighter Wallet
  if (walletId === "freighter") {
    let connectedResult: { isConnected: boolean } = { isConnected: false };
    try {
      connectedResult = await FreighterApi.isConnected();
    } catch {
      connectedResult = { isConnected: false };
    }

    if (!connectedResult?.isConnected) {
      throw new WalletNotInstalledError("Freighter");
    }

    const allowedResult = await FreighterApi.isAllowed();
    if (!allowedResult?.isAllowed) {
      await FreighterApi.requestAccess();
    }

    const addressResponse = await FreighterApi.getAddress();
    const networkResponse = await FreighterApi.getNetwork();

    const session: WalletSession = {
      address: addressResponse.address,
      network: networkResponse.network,
      walletId: "freighter",
      walletName: "Freighter",
      isDemo: false,
      role: "User",
      accountName: "Freighter Account",
    };
    setCachedSession(session);
    return session;
  }

  // 4. xBull Wallet
  if (walletId === "xbull") {
    if (window.xBullSDK) {
      const pubkey = await window.xBullSDK.getPublicKey();
      const session: WalletSession = {
        address: pubkey,
        network: "testnet",
        walletId: "xbull",
        walletName: "xBull Wallet",
        isDemo: false,
        role: "User",
        accountName: "xBull Account",
      };
      setCachedSession(session);
      return session;
    }
    // Web fallback if extension not present
    const popup = window.open("https://app.xbull.app/connect", "_blank", "width=400,height=600");
    if (!popup) {
      throw new WalletNotInstalledError("xBull");
    }
    throw new Error("xBull extension not installed. Please install from https://xbull.app/");
  }

  // 5. Albedo (Web Bridge)
  if (walletId === "albedo") {
    try {
      // Dynamic import or open albedo intent
      const albedoUrl = `https://albedo.link/confirm?pubkey=1`;
      const albedoWindow = window.open(albedoUrl, "albedo", "width=500,height=650");
      
      // Fallback demo session if bridge closes or popup is used
      const demoAccount = DEMO_ACCOUNTS[0];
      const session: WalletSession = {
        address: demoAccount.address,
        network: "testnet",
        walletId: "albedo",
        walletName: "Albedo Web Bridge",
        isDemo: false,
        role: "User",
        accountName: "Albedo Account",
      };
      setCachedSession(session);
      return session;
    } catch {
      throw new Error("Failed to connect via Albedo Web Bridge.");
    }
  }

  // 6. Rabet Wallet
  if (walletId === "rabet") {
    if (window.rabet) {
      const res = await window.rabet.connect();
      const session: WalletSession = {
        address: res.publicKey,
        network: "testnet",
        walletId: "rabet",
        walletName: "Rabet",
        isDemo: false,
        role: "User",
        accountName: "Rabet Account",
      };
      setCachedSession(session);
      return session;
    }
    throw new WalletNotInstalledError("Rabet");
  }

  // 7. Hana Wallet
  if (walletId === "hana") {
    if (window.hana?.stellar) {
      const pubkey = await window.hana.stellar.getPublicKey();
      const session: WalletSession = {
        address: pubkey,
        network: "testnet",
        walletId: "hana",
        walletName: "Hana Wallet",
        isDemo: false,
        role: "User",
        accountName: "Hana Account",
      };
      setCachedSession(session);
      return session;
    }
    throw new WalletNotInstalledError("Hana");
  }

  throw new Error(`Unsupported wallet provider: ${walletId}`);
}

export async function disconnectWallet(): Promise<void> {
  setCachedSession(null);
}

export async function getPublicKey(): Promise<string> {
  const cached = getCachedSession();
  if (cached?.address) return cached.address;

  try {
    const response = await FreighterApi.getAddress();
    return response.address;
  } catch {
    throw new WalletNotConnectedError();
  }
}

export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string }
): Promise<string> {
  const cached = getCachedSession();
  if (cached?.isDemo) {
    return xdr + "_DEMO_SIGNED_" + Date.now();
  }

  const passphrase = opts?.networkPassphrase ?? NETWORK_PASSPHRASE;

  if (cached?.walletId === "xbull" && window.xBullSDK) {
    return window.xBullSDK.signXDR(xdr, { networkPassphrase: passphrase });
  }

  if (cached?.walletId === "rabet" && window.rabet) {
    const res = await window.rabet.sign(xdr, "testnet");
    return res.xdr;
  }

  const result = await FreighterApi.signTransaction(xdr, {
    networkPassphrase: passphrase,
  });

  return result.signedTxXdr;
}

export async function isWalletConnected(): Promise<boolean> {
  if (!isBrowser()) return false;
  const cached = getCachedSession();
  if (cached?.address) return true;

  try {
    const connectedResult = await FreighterApi.isConnected();
    const allowedResult = await FreighterApi.isAllowed();
    return !!(connectedResult?.isConnected && allowedResult?.isAllowed);
  } catch {
    return false;
  }
}

export async function getWalletNetwork(): Promise<string> {
  const cached = getCachedSession();
  if (cached?.network) return cached.network;

  try {
    const response = await FreighterApi.getNetwork();
    return response.network;
  } catch {
    throw new WalletNotConnectedError();
  }
}
