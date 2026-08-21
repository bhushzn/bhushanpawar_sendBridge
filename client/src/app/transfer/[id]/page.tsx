"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useWallet } from "@/hooks/use-wallet";
import { useTransfer, useTransferStatus } from "@/hooks/use-contract";
import { useCancelTransfer } from "@/hooks/use-transfers";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusTimeline } from "@/components/transfer/status-timeline";
import { ExplorerLink } from "@/components/blockchain/explorer-link";
import { formatAmount, formatFee, formatTimestamp } from "@/lib/stellar/format";
import { ASSETS, type AssetCode } from "@/lib/stellar/assets";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "outline"> = {
  Pending: "warning",
  Processing: "default",
  Completed: "success",
  Failed: "danger",
  Cancelled: "outline",
};

export default function TransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const transferStore = useTransferStore();
  const id = Number(params.id);
  const { data: transfer, isLoading } = useTransfer(id);
  const { data: statusOverride } = useTransferStatus(id);
  const cancelTransfer = useCancelTransfer();
  const [cancelling, setCancelling] = React.useState(false);

  const activeStatus = statusOverride || transfer?.status || "Unknown";
  const isPending = activeStatus === "Pending";
  const isSender =
    wallet.isConnected &&
    transfer?.sender &&
    wallet.address?.toLowerCase() === transfer.sender.toLowerCase();

  const handleCancel = async () => {
    if (!isPending || !isSender) return;
    setCancelling(true);
    try {
      await cancelTransfer.mutateAsync({ transferId: id });
    } catch {
      // Error handled in store
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mx-auto mb-6">
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Transfer Not Found</h1>
          <p className="text-gray-400 mb-8">
            Transfer #{id} could not be found or the contract is not deployed.
          </p>
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const sourceName =
    ASSETS[transfer.source_asset as AssetCode]?.name || transfer.source_asset;
  const destName =
    ASSETS[transfer.dest_asset as AssetCode]?.name || transfer.dest_asset;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Transfer #{transfer.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={STATUS_VARIANTS[activeStatus] || "outline"}>
              {activeStatus}
            </Badge>
          </div>
        </div>
      </div>

      <StatusTimeline currentStatus={activeStatus} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transfer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amounts */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Source Amount</p>
              <p className="text-xl font-bold text-white">
                {formatAmount(transfer.source_amount)}{" "}
                <span className="text-sm font-medium text-gray-400">{sourceName}</span>
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-600 mx-4" />
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Destination Amount</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatAmount(transfer.dest_amount)}{" "}
                <span className="text-sm font-medium text-gray-400">{destName}</span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Sender */}
          <DetailRow
            label="Sender"
            value={
              <ExplorerLink
                value={transfer.sender}
                type="account"
                truncate={12}
              />
            }
          />

          {/* Recipient */}
          <DetailRow
            label="Recipient"
            value={
              <ExplorerLink
                value={transfer.recipient}
                type="account"
                truncate={12}
              />
            }
          />

          <Separator />

          {/* Exchange Rate */}
          <DetailRow
            label="Exchange Rate"
            value={
              <span className="text-sm text-gray-300 font-mono">
                1 {sourceName} ={" "}
                {transfer.exchange_rate > 0
                  ? (transfer.exchange_rate / 1_000_000).toFixed(6)
                  : "—"}{" "}
                {destName}
              </span>
            }
          />

          {/* Fee */}
          <DetailRow
            label="Fee"
            value={
              <span className="text-sm text-gray-300">{formatFee(transfer.fee_bps)}</span>
            }
          />

          <Separator />

          {/* Created */}
          <DetailRow
            label="Created"
            value={
              <span className="text-sm text-gray-300 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-500" />
                {transfer.created_at
                  ? formatTimestamp(transfer.created_at)
                  : "—"}
              </span>
            }
          />

          {/* Updated */}
          <DetailRow
            label="Last Updated"
            value={
              <span className="text-sm text-gray-300 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-500" />
                {transfer.updated_at
                  ? formatTimestamp(transfer.updated_at)
                  : "—"}
              </span>
            }
          />
        </CardContent>
      </Card>

      {/* Cancel or Operator Actions */}
      {isPending && isSender && (
        <Card className="border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Cancel Transfer</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cancel this pending transfer before it is processed.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleCancel}
                loading={cancelling}
                disabled={cancelling}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operator Quick Action (for testing & operator role) */}
      {(activeStatus === "Pending" || activeStatus === "Processing") && (
        <Card className="border-cyan-500/20 bg-cyan-950/10">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-cyan-300">Operator Settlement Controls</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeStatus === "Pending"
                    ? "Advance this remittance to processing state."
                    : "Complete and settle this transfer to recipient."}
                </p>
              </div>
              <div className="flex gap-2">
                {activeStatus === "Pending" && (
                  <Link href="/operator">
                    <Button variant="default" size="sm">
                      Process in Operator Portal →
                    </Button>
                  </Link>
                )}
                {activeStatus === "Processing" && (
                  <Link href="/operator">
                    <Button variant="success" size="sm">
                      Complete Settlement →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-gray-500">{label}</span>
      {value}
    </div>
  );
}
