export interface AssetInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  description: string;
  defaultRateToUSD: number; // e.g. 1 USD = X units, or 1 unit = X USD
}

export const ASSETS = {
  SB_USD: {
    code: "SB_USD",
    name: "SB-USD",
    symbol: "$",
    flag: "🇺🇸",
    description: "Testnet US Dollar (Anchor)",
    defaultRateToUSD: 1.0,
  },
  SB_INR: {
    code: "SB_INR",
    name: "SB-INR",
    symbol: "₹",
    flag: "🇮🇳",
    description: "Testnet Indian Rupee",
    defaultRateToUSD: 0.012, // 1 INR ~ 0.012 USD; 1 USD = 83.33 INR
  },
  SB_EUR: {
    code: "SB_EUR",
    name: "SB-EUR",
    symbol: "€",
    flag: "🇪🇺",
    description: "Testnet Euro",
    defaultRateToUSD: 1.08, // 1 EUR ~ 1.08 USD
  },
  SB_GBP: {
    code: "SB_GBP",
    name: "SB-GBP",
    symbol: "£",
    flag: "🇬🇧",
    description: "Testnet British Pound",
    defaultRateToUSD: 1.27, // 1 GBP ~ 1.27 USD
  },
  SB_SGD: {
    code: "SB_SGD",
    name: "SB-SGD",
    symbol: "S$",
    flag: "🇸🇬",
    description: "Testnet Singapore Dollar",
    defaultRateToUSD: 0.74, // 1 SGD ~ 0.74 USD
  },
  SB_AED: {
    code: "SB_AED",
    name: "SB-AED",
    symbol: "د.إ",
    flag: "🇦🇪",
    description: "Testnet UAE Dirham",
    defaultRateToUSD: 0.272, // 1 AED ~ 0.272 USD
  },
  SB_PHP: {
    code: "SB_PHP",
    name: "SB-PHP",
    symbol: "₱",
    flag: "🇵🇭",
    description: "Testnet Philippine Peso",
    defaultRateToUSD: 0.0175, // 1 PHP ~ 0.0175 USD
  },
  SB_BRL: {
    code: "SB_BRL",
    name: "SB-BRL",
    symbol: "R$",
    flag: "🇧🇷",
    description: "Testnet Brazilian Real",
    defaultRateToUSD: 0.18, // 1 BRL ~ 0.18 USD
  },
} as const;

export type AssetCode = keyof typeof ASSETS;

export function getAssetByCode(code: string): AssetInfo | null {
  return (ASSETS as Record<string, AssetInfo>)[code] ?? null;
}

export function isValidAssetCode(code: string): boolean {
  return Object.values(ASSETS).some((a) => a.code === code);
}

export function getDefaultExchangeRate(sourceCode: string, destCode: string): number {
  const src = getAssetByCode(sourceCode);
  const dst = getAssetByCode(destCode);
  if (!src || !dst) return 1_000_000; // 1:1 fallback
  
  // Rate = (src USD value / dst USD value) * 1,000,000 (precision 6)
  const rate = (src.defaultRateToUSD / dst.defaultRateToUSD);
  return Math.round(rate * 1_000_000);
}

