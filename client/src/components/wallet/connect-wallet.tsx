"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccountExplorerUrl } from "@/lib/stellar/explorer";
import {
  DEMO_ACCOUNTS,
  SUPPORTED_WALLETS,
  getAvailableWallets,
} from "@/lib/stellar/wallet/stellar-wallet";
import type { WalletInfo } from "@/lib/stellar/wallet/wallet-types";
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Shield,
  UserCheck,
  Key,
  X,
  AlertCircle,
  RefreshCw,
  Globe,
  Radio,
} from "lucide-react";

type FilterCategory = "all" | "extension" | "web" | "instant";

export function ConnectWallet() {
  const wallet = useWallet();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<FilterCategory>("all");
  const [wallets, setWallets] = React.useState<WalletInfo[]>(SUPPORTED_WALLETS);
  const [selectedDemoId, setSelectedDemoId] = React.useState<string>("demo-alice");
  const [customKey, setCustomKey] = React.useState<string>("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function loadWallets() {
      const list = await getAvailableWallets();
      setWallets(list);
    }
    loadWallets();
  }, [modalOpen]);

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

  const handleConnectProvider = async (walletId: string, demoId?: string) => {
    try {
      if (walletId === "custom") {
        await wallet.connect("custom", undefined);
      } else {
        await wallet.connect(walletId, demoId);
      }
      setModalOpen(false);
    } catch {
      // Error is tracked in wallet store
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

  const filteredWallets = wallets.filter((w) => {
    if (activeTab === "all") return true;
    return w.category === activeTab;
  });

  if (!wallet.isConnected) {
    return (
      <>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium border-0"
        >
          <Wallet className="h-4 w-4 mr-1.5 text-cyan-100" />
          Connect Wallet
        </Button>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1120] border border-cyan-500/30 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <Wallet className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Connect Stellar Wallet</h2>
                    <p className="text-xs text-gray-400">Choose a wallet provider or use instant Demo Mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 my-4 p-1 rounded-xl bg-slate-900 border border-white/5">
                {(
                  [
                    { id: "all", label: "All Wallets" },
                    { id: "extension", label: "Extensions" },
                    { id: "web", label: "Web / Universal" },
                    { id: "instant", label: "Instant & Dev" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Error Notification */}
              {wallet.error && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{wallet.error}</p>
                </div>
              )}

              {/* Wallet List */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {filteredWallets.map((item) => {
                  if (item.id === "demo") {
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">🧪</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Demo Keypair</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                                  Instant Testnet
                                </Badge>
                              </div>
                              <p className="text-[11px] text-gray-400">Pre-funded simulated testnet accounts</p>
                            </div>
                          </div>
                        </div>

                        {/* Account Selector */}
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {DEMO_ACCOUNTS.map((acc) => (
                            <button
                              key={acc.id}
                              onClick={() => handleConnectProvider("demo", acc.id)}
                              disabled={wallet.isLoading}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all text-left group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">{acc.avatar}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-white group-hover:text-cyan-300">
                                      {acc.name}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                                      {acc.role}
                                    </Badge>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {acc.initialBalance} XLM • {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-cyan-400 group-hover:translate-x-0.5 transition-transform font-medium">
                                Select <ChevronRight className="h-3.5 w-3.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/[0.04] transition-all text-left group"
                    >
                      <button
                        onClick={() => handleConnectProvider(item.id)}
                        disabled={wallet.isLoading}
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-lg">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {item.name}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 bg-slate-800 text-gray-300 border-white/10"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.isAvailable ? (
                              <Badge variant="success" className="text-[9px] px-1.5 py-0">
                                Detected
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 pl-3">
                        {item.isAvailable ? (
                          <button
                            onClick={() => handleConnectProvider(item.id)}
                            disabled={wallet.isLoading}
                            className="p-1.5 text-gray-400 group-hover:text-cyan-400 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : item.installUrl ? (
                          <a
                            href={item.installUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-medium text-cyan-400/80 hover:text-cyan-300 px-2 py-1 rounded-md hover:bg-cyan-500/10 border border-cyan-500/20"
                          >
                            Install <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer status */}
              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Stellar Soroban Testnet
                </span>
                <a
                  href="https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Wallet Docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Connected Dropdown UI
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-left shadow-md cursor-pointer"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="flex flex-col">
          <span className="text-white font-medium text-xs font-mono">{wallet.shortAddress}</span>
          <span className="text-[10px] text-cyan-400">{wallet.walletId === "demo" ? "DEMO MODE" : wallet.accountName || "CONNECTED"}</span>
        </div>
        <div className="ml-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-gray-300 font-mono">
          {wallet.formattedBalance} XLM
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b1120] border border-cyan-500/30 shadow-2xl p-4 z-50 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{wallet.accountName || "Connected Wallet"}</span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                {wallet.role || "User"}
              </Badge>
            </div>
            <p className="text-[11px] font-mono text-gray-400 break-all">{wallet.address}</p>
          </div>

          <div className="py-2 space-y-1">
            <div className="flex justify-between text-xs py-1">
              <span className="text-gray-400">Balance:</span>
              <span className="text-white font-mono font-medium">{wallet.formattedBalance} XLM</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-gray-400">Network:</span>
              <span className="text-cyan-400 font-medium">Stellar Testnet</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <button
              onClick={handleCopyAddress}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
              {copied ? "Copied to Clipboard" : "Copy Address"}
            </button>

            {wallet.address && (
              <a
                href={getAccountExplorerUrl(wallet.address)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                View on Stellar Expert
              </a>
            )}

            <button
              onClick={() => {
                setDropdownOpen(false);
                setModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Switch Wallet Provider
            </button>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
