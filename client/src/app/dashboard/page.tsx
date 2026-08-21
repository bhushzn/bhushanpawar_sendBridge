"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { useTransferCount, useRecentTransfers } from "@/hooks/use-contract";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { truncateAddress, formatAmount, formatFee, formatTimestamp } from "@/lib/stellar/format";
import { ASSETS, type AssetCode } from "@/lib/stellar/assets";
import { Wallet, ArrowRight, Send, Activity, BarChart3, Clock, CheckCircle2, DollarSign, Inbox } from "lucide-react";

export default function DashboardPage() {
  const wallet = useWallet();
  const { data: transferCount, isLoading: countLoading } = useTransferCount();
  const { data: recentTransfers, isLoading: recentLoading } = useRecentTransfers(5);

  if (!wallet.isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mx-auto mb-6">
            <Wallet className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Dashboard</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Connect your wallet to view your dashboard, track transfers, and manage your remittances.
          </p>
          <Button onClick={() => wallet.connect()} loading={wallet.isLoading} size="lg">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = recentTransfers?.filter((t) => t.status === "Completed").length ?? 0;
  const pendingCount = recentTransfers?.filter((t) => t.status === "Pending" || t.status === "Processing").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your SendBridge activity</p>
      </div>

      {/* Wallet Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Wallet className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Connected Wallet</p>
                <p className="text-sm font-mono text-white">{wallet.shortAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">XLM Balance</p>
                <p className="text-lg font-bold text-white">{wallet.formattedBalance} <span className="text-sm font-normal text-gray-400">XLM</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Network</p>
                <Badge variant="default" className="text-xs">{wallet.network || "Testnet"}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-cyan-400" />}
          label="Total Transfers"
          value={countLoading ? "—" : String(transferCount ?? 0)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          label="Pending"
          value={countLoading ? "—" : String(pendingCount)}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          label="Completed"
          value={countLoading ? "—" : String(completedCount)}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-gray-400" />}
          label="Total Fees"
          value={countLoading ? "—" : `${transferCount ?? 0}`}
        />
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Recent Transfers
            </CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : !recentTransfers || recentTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mb-3">
                <Inbox className="h-6 w-6 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">No transfers yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Send your first cross-border transfer to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransfers.map((transfer) => (
                <Link key={transfer.id} href={`/transfer/${transfer.id}`}>
                  <div className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">#{transfer.id}</span>
                        <span className="text-sm text-white">
                          {(parseInt(transfer.source_amount) / 1_000_000).toFixed(2)}{" "}
                          <span className="text-gray-500">{transfer.source_asset}</span>
                          <ArrowRight className="inline h-3 w-3 text-gray-600 mx-1" />
                          {(parseInt(transfer.dest_amount) / 1_000_000).toFixed(2)}{" "}
                          <span className="text-gray-500">{transfer.dest_asset}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500 font-mono">
                          {truncateAddress(transfer.recipient, 4)}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-[11px] text-gray-500">
                          {formatTimestamp(transfer.created_at)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        transfer.status === "Completed"
                          ? "success"
                          : transfer.status === "Pending" || transfer.status === "Processing"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px] flex-shrink-0"
                    >
                      {transfer.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/send">
          <div className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-cyan-500/30 transition-all cursor-pointer h-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Send className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold mb-1">Send Money</h3>
            <p className="text-sm text-gray-400">Start a new cross-border remittance</p>
          </div>
        </Link>
        <Link href="/activity">
          <div className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-cyan-500/30 transition-all cursor-pointer h-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold mb-1">View Activity</h3>
            <p className="text-sm text-gray-400">See live on-chain transfer activity</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
