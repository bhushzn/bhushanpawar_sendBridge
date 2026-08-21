import * as FreighterApi from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "../config";
import {
  WalletNotConnectedError,
  WalletNotInstalledError,
} from "../errors";
import type { WalletInfo, WalletSession, DemoAccount } from "./wallet-types";

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

const FREIGHTER_WALLET: WalletInfo = {
  id: "freighter",
  name: "Freighter Wallet",
  icon: "🔑",
  isAvailable: false,
  type: "freighter",
  description: "Official Stellar browser extension wallet",
};

const DEMO_WALLET: WalletInfo = {
  id: "demo",
  name: "Demo Testnet Wallet",
  icon: "🧪",
  isAvailable: true,
  type: "demo",
  description: "Instant testnet simulator with funded accounts",
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
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
  if (!isBrowser()) return [{ ...FREIGHTER_WALLET, isAvailable: false }, DEMO_WALLET];

  let freighterAvailable = false;
  try {
    const result = await FreighterApi.isConnected();
    freighterAvailable = !!result?.isConnected;
  } catch {
    freighterAvailable = false;
  }

  return [
    { ...FREIGHTER_WALLET, isAvailable: freighterAvailable },
    DEMO_WALLET,
  ];
}

export async function connectWallet(walletId = "freighter", demoAccountId?: string): Promise<WalletSession> {
  if (!isBrowser()) {
    throw new WalletNotInstalledError("Freighter");
  }

  if (walletId === "demo" || demoAccountId) {
    const account = DEMO_ACCOUNTS.find((a) => a.id === (demoAccountId || "demo-alice")) || DEMO_ACCOUNTS[0];
    const session: WalletSession = {
      address: account.address,
      network: "testnet",
      walletId: account.id,
      isDemo: true,
      role: account.role,
      accountName: account.name,
    };
    setCachedSession(session);
    return session;
  }

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
  const address = addressResponse.address;

  const networkResponse = await FreighterApi.getNetwork();
  const network = networkResponse.network;

  const session: WalletSession = {
    address,
    network,
    walletId: "freighter",
    isDemo: false,
    role: "User",
    accountName: "Freighter Account",
  };

  setCachedSession(session);
  return session;
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
  opts?: { networkPassphrase?: string },
): Promise<string> {
  const cached = getCachedSession();
  if (cached?.isDemo) {
    // For demo accounts, simulated signing adds a mock signature suffix
    return xdr + "_DEMO_SIGNED_" + Date.now();
  }

  const passphrase = opts?.networkPassphrase ?? NETWORK_PASSPHRASE;

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

