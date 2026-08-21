"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Badge } from "@/components/ui/badge";

function WalletStatus() {
  const wallet = useWallet();

  if (!wallet.isConnected) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
      <div className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="text-sm text-white font-medium">
        {wallet.shortAddress}
      </span>
      <div className="h-4 w-px bg-white/10" />
      <span className="text-xs text-gray-400">
        {wallet.formattedBalance} XLM
      </span>
      {wallet.isOnTestnet && (
        <Badge variant="default" className="text-[9px] uppercase tracking-wider px-1.5 py-0">
          Testnet
        </Badge>
      )}
    </div>
  );
}

export { WalletStatus };
