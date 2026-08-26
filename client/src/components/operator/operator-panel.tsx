"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useRecentTransfers, useFeeBps, useTransferCount } from "@/hooks/use-contract";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ASSETS, type AssetCode, getAssetByCode, getDefaultExchangeRate } from "@/lib/stellar/assets";
import { formatAmount, formatFee, formatTimestamp, truncateAddress } from "@/lib/stellar/format";
import {
  executeSimulatedSetExchangeRate,
  executeSimulatedSetFeeBps,
  executeSimulatedSetKyc,
  executeSimulatedUpdateStatus,
} from "@/lib/stellar/contract";
import {
  Shield,
  ShieldCheck,
  ArrowRightLeft,
  Settings2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Sparkles,
  Zap,
  DollarSign,
  UserCheck,
  Sliders,
  Layers,
} from "lucide-react";

const ASSET_LIST = Object.values(ASSETS);
const ASSET_OPTIONS = ASSET_LIST.map((a) => ({
  value: a.code,
  label: `${a.flag} ${a.name} (${a.symbol})`,
}));

export function OperatorPanel() {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const { data: recentTransfers, refetch: refetchTransfers } = useRecentTransfers(30);
  const { data: currentFeeBps } = useFeeBps();
  const { data: totalTransfers } = useTransferCount();

  // Exchange rate state
  const [srcAsset, setSrcAsset] = React.useState("SB_USD");
  const [dstAsset, setDstAsset] = React.useState("SB_INR");
  const [rateInput, setRateInput] = React.useState("83.333333");
  const [rateLoading, setRateLoading] = React.useState(false);
  const [rateSuccess, setRateSuccess] = React.useState<string | null>(null);

  // Fee state
  const [newFeeBps, setNewFeeBps] = React.useState("50");
  const [feeLoading, setFeeLoading] = React.useState(false);
  const [feeSuccess, setFeeSuccess] = React.useState(false);

  // KYC state
  const [kycAddress, setKycAddress] = React.useState("");
  const [kycLoading, setKycLoading] = React.useState(false);
  const [kycSuccess, setKycSuccess] = React.useState<string | null>(null);

  // Transfer action loading state
  const [processingId, setProcessingId] = React.useState<number | null>(null);



  const handleUpdateRate = async () => {
    const num = parseFloat(rateInput);
    if (isNaN(num) || num <= 0) return;
    setRateLoading(true);
    setRateSuccess(null);
    try {
      const scaledRate = Math.round(num * 1_000_000);
      const res = await executeSimulatedSetExchangeRate(srcAsset, dstAsset, scaledRate);
      queryClient.invalidateQueries({ queryKey: ["exchangeRate", srcAsset, dstAsset] });
      setRateSuccess(`Rate updated to 1 ${srcAsset} = ${num} ${dstAsset} (Tx: ${res.hash.slice(0, 10)}...)`);
      setTimeout(() => setRateSuccess(null), 4000);
    } finally {
      setRateLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    const bps = parseInt(newFeeBps);
    if (isNaN(bps) || bps < 0 || bps > 1000) return;
    setFeeLoading(true);
    setFeeSuccess(false);
    try {
      await executeSimulatedSetFeeBps(bps);
      queryClient.invalidateQueries({ queryKey: ["feeBps"] });
      setFeeSuccess(true);
      setTimeout(() => setFeeSuccess(false), 3000);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleGrantKyc = async () => {
    if (!kycAddress.trim()) return;
    setKycLoading(true);
    setKycSuccess(null);
    try {
      const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      await executeSimulatedSetKyc(kycAddress.trim(), hash);
      queryClient.invalidateQueries({ queryKey: ["kyc", kycAddress.trim()] });
      queryClient.invalidateQueries({ queryKey: ["kycInfo", kycAddress.trim()] });
      setKycSuccess(`KYC attestation granted for ${truncateAddress(kycAddress.trim(), 8)}`);
      setKycAddress("");
      setTimeout(() => setKycSuccess(null), 4000);
    } finally {
      setKycLoading(false);
    }
  };

  const handleAdvanceStatus = async (id: number, nextStatus: string) => {
    setProcessingId(id);
    try {
      await executeSimulatedUpdateStatus(id, nextStatus);
      queryClient.invalidateQueries({ queryKey: ["transfer", id] });
      queryClient.invalidateQueries({ queryKey: ["transferStatus", id] });
      queryClient.invalidateQueries({ queryKey: ["recentTransfers"] });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingTransfers = recentTransfers?.filter((t) => t.status === "Pending") ?? [];
  const processingTransfers = recentTransfers?.filter((t) => t.status === "Processing") ?? [];
  const completedTransfers = recentTransfers?.filter((t) => t.status === "Completed") ?? [];

  return (
    <div className="space-y-8">
      {/* Operator Status Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">SendBridge Operator Portal</h2>
                <Badge variant="default" className="text-xs">Active Controller</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage live exchange rate corridors, on-chain KYC attestations, and settlement pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-right">
              <span className="text-gray-500 block text-[10px]">Protocol Fee</span>
              <span className="font-bold text-cyan-300 font-mono">{formatFee(currentFeeBps ?? 50)}</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-right">
              <span className="text-gray-500 block text-[10px]">Total Transfers</span>
              <span className="font-bold text-white font-mono">{totalTransfers ?? recentTransfers?.length ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Rate Manager & Fee Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Exchange Rate Controller */}
        <Card className="border-cyan-500/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Live Exchange Rate Feeder
            </CardTitle>
            <CardDescription>
              Update price oracle rates for cross-border currency pairs on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Source Currency"
                options={ASSET_OPTIONS}
                value={srcAsset}
                onChange={(e) => {
                  setSrcAsset(e.target.value);
                  setRateInput((getDefaultExchangeRate(e.target.value, dstAsset) / 1_000_000).toFixed(6));
                }}
              />
              <Select
                label="Destination Currency"
                options={ASSET_OPTIONS}
                value={dstAsset}
                onChange={(e) => {
                  setDstAsset(e.target.value);
                  setRateInput((getDefaultExchangeRate(srcAsset, e.target.value) / 1_000_000).toFixed(6));
                }}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-medium">
                Exchange Rate (1 {srcAsset} = X {dstAsset})
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.000001"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="e.g. 83.333333"
                />
                <Button onClick={handleUpdateRate} loading={rateLoading} className="px-5 flex-shrink-0">
                  Update Rate
                </Button>
              </div>
            </div>

            {rateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{rateSuccess}</span>
              </div>
            )}

            <div className="pt-2">
              <p className="text-[11px] text-gray-500">
                Live rate preview: 100 {srcAsset} = {(100 * (parseFloat(rateInput) || 0)).toFixed(2)} {dstAsset}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. KYC Attestation & Protocol Fee */}
        <div className="space-y-6">
          {/* KYC Attestation Issuer */}
          <Card className="border-cyan-500/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-emerald-400" />
                KYC Attestation Issuer
              </CardTitle>
              <CardDescription>
                Issue cryptographic KYC compliance attestations for wallet addresses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">
                  Stellar Public Address
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="G..."
                    value={kycAddress}
                    onChange={(e) => setKycAddress(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button onClick={handleGrantKyc} loading={kycLoading} disabled={!kycAddress.trim()} className="flex-shrink-0">
                    Grant KYC
                  </Button>
                </div>
              </div>

              {kycSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{kycSuccess}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Protocol Fee Controller */}
          <Card className="border-cyan-500/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sliders className="h-5 w-5 text-purple-400" />
                Protocol Fee Configuration
              </CardTitle>
              <CardDescription>
                Set platform fee in basis points (1 bps = 0.01%, 50 bps = 0.50%).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={newFeeBps}
                    onChange={(e) => setNewFeeBps(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={handleUpdateFee} loading={feeLoading} variant="outline" className="flex-shrink-0">
                  Save Fee BPS
                </Button>
                <span className="text-xs text-gray-400">
                  = {(parseInt(newFeeBps) / 100 || 0).toFixed(2)}% fee
                </span>
              </div>
              {feeSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Fee updated successfully.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Live Remittance Settlement Pipeline */}
      <Card className="border-cyan-500/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                Live Remittance Processing Queue
              </CardTitle>
              <CardDescription>
                Monitor incoming transfers and advance settlement state on Stellar.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchTransfers()}>
              <RotateCw className="h-4 w-4 mr-1.5" />
              Refresh Queue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!recentTransfers || recentTransfers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No transfers currently in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-400">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Sender → Recipient</th>
                    <th className="pb-3 pr-4">Corridor & Amount</th>
                    <th className="pb-3 pr-4">Rate / Fee</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Operator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4 font-mono text-xs text-gray-400">
                        #{t.id}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="text-xs font-mono text-white">
                          From: {truncateAddress(t.sender, 6)}
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          To: {truncateAddress(t.recipient, 6)}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="text-xs font-semibold text-white">
                          {(parseInt(t.source_amount) / 1_000_000).toFixed(2)} {t.source_asset}
                        </div>
                        <div className="text-xs text-emerald-400 font-mono">
                          → {(parseInt(t.dest_amount) / 1_000_000).toFixed(2)} {t.dest_asset}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-gray-400">
                        <div>1 {t.source_asset} = {(t.exchange_rate / 1_000_000).toFixed(4)} {t.dest_asset}</div>
                        <div className="text-[10px] text-gray-500">Fee: {formatFee(t.fee_bps)}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <Badge
                          variant={
                            t.status === "Completed"
                              ? "success"
                              : t.status === "Processing" || t.status === "Pending"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {t.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs px-2.5"
                            loading={processingId === t.id}
                            onClick={() => handleAdvanceStatus(t.id, "Processing")}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Process
                          </Button>
                        )}
                        {t.status === "Processing" && (
                          <div className="inline-flex gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              className="h-7 text-xs px-2.5"
                              loading={processingId === t.id}
                              onClick={() => handleAdvanceStatus(t.id, "Completed")}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2"
                              loading={processingId === t.id}
                              onClick={() => handleAdvanceStatus(t.id, "Failed")}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {t.status === "Completed" && (
                          <span className="text-xs text-emerald-400 font-medium">Settled ✓</span>
                        )}
                        {t.status === "Cancelled" && (
                          <span className="text-xs text-gray-500">Cancelled</span>
                        )}
                        {t.status === "Failed" && (
                          <span className="text-xs text-red-400">Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
