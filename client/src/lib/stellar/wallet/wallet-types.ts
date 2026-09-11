export type WalletType = "freighter" | "xbull" | "albedo" | "rabet" | "hana" | "demo" | "custom";

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  isAvailable: boolean;
  type: WalletType;
  description: string;
  category: "all" | "extension" | "web" | "instant";
  badge?: string;
  installUrl?: string;
}

export interface DemoAccount {
  id: string;
  name: string;
  role: "Sender" | "Operator" | "Admin";
  address: string;
  secretKey?: string;
  initialBalance: string;
  avatar: string;
}

export interface WalletSession {
  address: string;
  network: string;
  walletId: string;
  walletName?: string;
  isDemo?: boolean;
  role?: string;
  accountName?: string;
}
