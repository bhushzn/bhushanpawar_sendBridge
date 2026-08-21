export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  isAvailable: boolean;
  type?: "freighter" | "demo";
  description?: string;
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
  isDemo?: boolean;
  role?: string;
  accountName?: string;
}

