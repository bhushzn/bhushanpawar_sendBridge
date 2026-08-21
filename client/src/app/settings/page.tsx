"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_ADDRESS, RPC_URL, NETWORK, NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import {
  Settings,
  FileCode,
  Globe,
  Server,
  Info,
  AlertTriangle,
  Palette,
  Trash2,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function SettingsPage() {
  const wallet = useWallet();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [storageCleared, setStorageCleared] = React.useState(false);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setStorageCleared(true);
      setTimeout(() => setStorageCleared(false), 3000);
    } catch {
      // Storage not available
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-cyan-400" />
          Settings
        </h1>
        <p className="text-gray-400 mt-1">Application configuration and information</p>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-cyan-400" />
            Smart Contract
          </CardTitle>
          <CardDescription>Soroban contract details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            label="Contract Address"
            value={CONTRACT_ADDRESS || "Not deployed"}
            mono
            onCopy={CONTRACT_ADDRESS ? () => handleCopy(CONTRACT_ADDRESS, "contract") : undefined}
            copied={copied === "contract"}
          />
          <InfoRow
            label="Network"
            value={NETWORK}
            badge
          />
          <InfoRow
            label="Network Passphrase"
            value={NETWORK_PASSPHRASE}
            mono
            onCopy={() => handleCopy(NETWORK_PASSPHRASE, "passphrase")}
            copied={copied === "passphrase"}
          />
        </CardContent>
      </Card>

      {/* RPC Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            RPC Configuration
          </CardTitle>
          <CardDescription>Stellar RPC endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            label="RPC URL"
            value={RPC_URL}
            mono
            onCopy={() => handleCopy(RPC_URL, "rpc")}
            copied={copied === "rpc"}
          />
        </CardContent>
      </Card>

      {/* Wallet Info */}
      {wallet.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" />
              Wallet
            </CardTitle>
            <CardDescription>Connected wallet details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label="Address"
              value={wallet.address || "—"}
              mono
              onCopy={wallet.address ? () => handleCopy(wallet.address!, "address") : undefined}
              copied={copied === "address"}
            />
            <InfoRow
              label="Balance"
              value={`${wallet.formattedBalance} XLM`}
            />
            <InfoRow
              label="Wallet"
              value={wallet.walletId || "Unknown"}
            />
          </CardContent>
        </Card>
      )}

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-cyan-400" />
            Appearance
          </CardTitle>
          <CardDescription>Theme and display settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">Theme</span>
            <Badge variant="default" className="text-xs">Dark</Badge>
          </div>
          <p className="text-xs text-gray-500">
            SendBridge uses a dark fintech theme optimized for low-light environments.
          </p>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-cyan-400" />
            Storage
          </CardTitle>
          <CardDescription>Manage local application data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Clear local storage and session data. This will disconnect your wallet and reset preferences.
          </p>
          {storageCleared ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Storage cleared successfully.
            </div>
          ) : (
            <Button variant="destructive" onClick={handleClearStorage}>
              <Trash2 className="h-4 w-4" />
              Clear Local Storage
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 space-y-2">
            <p className="text-sm text-amber-400 font-medium">Testnet Demo Only</p>
            <p className="text-xs text-amber-400/70 leading-relaxed">
              SendBridge is a demonstration application built on Stellar Testnet.
              No real funds are transferred or held. All assets are testnet-only
              tokens with no real-world value. This application is for educational
              and demonstration purposes only.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-400" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Application" value="SendBridge" />
          <InfoRow label="Version" value="0.1.0" />
          <InfoRow label="Framework" value="Next.js + Soroban" />
          <InfoRow label="Network" value="Stellar Testnet" />
          <Separator className="my-2" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Cross-border remittance powered by Stellar Soroban smart contracts.
            Fast, transparent, and low-cost international transfers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  badge,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge variant="default" className="text-xs capitalize">{value}</Badge>
        ) : (
          <span className={`text-sm text-white ${mono ? "font-mono text-xs" : ""} max-w-[280px] truncate`}>
            {value}
          </span>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
