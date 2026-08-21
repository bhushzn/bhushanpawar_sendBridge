"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccountExplorerUrl } from "@/lib/stellar/explorer";
import { DEMO_ACCOUNTS, getAvailableWallets } from "@/lib/stellar/wallet/stellar-wallet";
import type { WalletInfo } from "@/lib/stellar/wallet/wallet-types";
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  ChevronDown,
  Sparkles,
  Shield,
  UserCheck,
  Key,
  X,
  AlertCircle,
} from "lucide-react";

function ConnectWallet() {
  const wallet = useWallet();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [wallets, setWallets] = React.useState<WalletInfo[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function loadWallets() {
      const list = await getAvailableWallets();
      setWallets(list);
    }
    loadWallets();
  }, []);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnectFreighter = async () => {
    try {
      await wallet.connect("freighter");
      setModalOpen(false);
    } catch {
      // Error handled in store
    }
  };

  const handleConnectDemo = async (demoId: string) => {
    try {
      await wallet.connect("demo", demoId);
      setModalOpen(false);
    } catch {
      // Error handled in store
    }
  };

  const handleCopyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    await wallet.disconnect();
    setDropdownOpen(false);
  };

  const freighterWallet = wallets.find((w) => w.id === "freighter");

  if (!wallet.isConnected) {
    return (
      <>
        <Button onClick={() => setModalOpen(true)} size="sm" className="shadow-lg shadow-cyan-500/20">
          <Wallet className="h-4 w-4 mr-1.5 text-cyan-200" />
          Connect Wallet
        </Button>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-[#0f172a] border border-cyan-500/20 shadow-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <Wallet className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
                  <p className="text-xs text-gray-400">Choose your preferred connection method</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* 1. Freighter Extension */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Browser Extension
                  </label>
                  <button
                    onClick={handleConnectFreighter}
                    disabled={wallet.isLoading}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 font-mono text-lg">
                        🔑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            Freighter Wallet
                          </span>
                          {freighterAvailable(freighterWallet) ? (
                            <Badge variant="success" className="text-[9px] px-1.5 py-0">Installed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-400 border-amber-500/30">Extension</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Official Stellar extension wallet</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                </div>

                {/* 2. Demo Accounts Simulator */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Demo Testnet Accounts
                    </label>
                    <span className="text-[10px] text-gray-400">Instant Access</span>
                  </div>

                  <div className="space-y-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => handleConnectDemo(acc.id)}
                        disabled={wallet.isLoading}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{acc.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                {acc.name}
                              </span>
                              <Badge
                                variant={acc.role === "Operator" ? "default" : acc.role === "Admin" ? "outline" : "success"}
                                className="text-[9px] px-1.5 py-0"
                              >
                                {acc.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 font-mono">
                              {acc.initialBalance} XLM · {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          Select →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {wallet.error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{wallet.error}</p>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-[11px] text-gray-500">
                  Stellar Testnet Remittance Bridge Demo
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-cyan-500/20 px-3 py-1.5 text-sm transition-all hover:bg-white/10 hover:border-cyan-500/40 cursor-pointer"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-medium text-xs sm:text-sm font-mono">{wallet.shortAddress}</span>
            {wallet.isDemo && (
              <Badge variant="outline" className="text-[9px] py-0 px-1 text-cyan-400 border-cyan-500/30">
                Demo
              </Badge>
            )}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/20 shadow-2xl py-2 animate-in zoom-in-95 fade-in duration-150 z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">
                  {wallet.accountName || "Connected"}
                </span>
              </div>
              <Badge variant="default" className="text-[10px]">
                {wallet.role || "User"}
              </Badge>
            </div>
            <p className="text-[11px] text-gray-400 font-mono break-all mt-1">
              {wallet.address}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Balance</span>
              <span className="text-sm font-bold text-white font-mono">
                {wallet.formattedBalance} XLM
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Network</span>
              <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-500/30">
                Stellar Testnet
              </Badge>
            </div>
          </div>

          {/* Switch Account Quick List */}
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">
              Switch Demo Account
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    handleConnectDemo(acc.id);
                    setDropdownOpen(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                    wallet.address === acc.address
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="block text-sm">{acc.avatar}</span>
                  <span className="block text-[10px] truncate">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={handleCopyAddress}
              className="flex w-full items-center gap-3 px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Address Copied!" : "Copy Public Address"}
            </button>
            <a
              href={getAccountExplorerUrl(wallet.address)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropdownOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              View on Stellar Explorer
            </a>
            <button
              onClick={handleDisconnect}
              className="flex w-full items-center gap-3 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function freighterAvailable(info?: WalletInfo): boolean {
  return Boolean(info?.isAvailable);
}

export { ConnectWallet };
