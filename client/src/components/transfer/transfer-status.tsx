"use client";

import * as React from "react";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusTimeline } from "@/components/transfer/status-timeline";
import { getTransactionExplorerUrl } from "@/lib/stellar/explorer";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  RotateCcw,
  Hash,
  ArrowRightLeft,
} from "lucide-react";

interface TransferStatusProps {
  onReset?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  building: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Building Transaction",
    color: "text-cyan-400",
  },
  signing: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Awaiting Signature",
    color: "text-cyan-400",
  },
  submitting: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Submitting to Network",
    color: "text-cyan-400",
  },
  polling: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Confirming Transaction",
    color: "text-cyan-400",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Transfer Complete",
    color: "text-emerald-400",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    label: "Transfer Failed",
    color: "text-red-400",
  },
  idle: {
    icon: <ArrowRightLeft className="h-5 w-5" />,
    label: "Ready",
    color: "text-gray-400",
  },
};

function TransferStatus({ onReset }: TransferStatusProps) {
  const store = useTransferStore();
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  const config = STATUS_CONFIG[store.transactionStatus] || STATUS_CONFIG.idle;

  const copyToClipboard = async (
    text: string,
    setter: (val: boolean) => void
  ) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <StatusTimeline currentStatus={store.transactionStatus} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            <span className={config.color}>{config.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {store.transactionHash && (
            <>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Transaction Hash
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                  <code className="text-xs text-white font-mono break-all flex-1">
                    {store.transactionHash}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(store.transactionHash!, setCopiedHash)
                    }
                    className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                  >
                    {copiedHash ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getTransactionExplorerUrl(store.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <Separator />
            </>
          )}

          {store.currentTransferId !== null && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <ArrowRightLeft className="h-3 w-3" />
                Transfer ID
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                <code className="text-sm text-white font-mono flex-1">
                  #{store.currentTransferId}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      String(store.currentTransferId),
                      setCopiedId
                    )
                  }
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {copiedId ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {store.transactionError && (
            <div className="rounded-xl bg-red-600/10 border border-red-600/20 px-4 py-3">
              <p className="text-sm text-red-400">{store.transactionError}</p>
            </div>
          )}

          {(store.transactionStatus === "success" ||
            store.transactionStatus === "error") &&
            onReset && (
              <Button
                variant="secondary"
                onClick={onReset}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                New Transfer
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export { TransferStatus };
