"use client";

import * as React from "react";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ASSETS, type AssetCode } from "@/lib/stellar/assets";
import { formatFee, formatRate, truncateAddress } from "@/lib/stellar/format";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Network,
  ShieldCheck,
} from "lucide-react";

interface ReviewTransferProps {
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}

function ReviewTransfer({ onConfirm, onBack, loading }: ReviewTransferProps) {
  const store = useTransferStore();
  const wallet = useWallet();

  const sourceName =
    ASSETS[store.sourceAsset as AssetCode]?.name || store.sourceAsset;
  const destName =
    ASSETS[store.destAsset as AssetCode]?.name || store.destAsset;
  const destAmount = store.getDestAmount();

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
            Review Transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl bg-amber-600/10 border border-amber-600/20 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-400 font-medium">Testnet Mode</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                This transaction will be submitted to the Stellar Testnet.
                No real funds will be transferred.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">You Send</p>
                <p className="text-lg font-bold text-white">
                  {store.sourceAmount || "0"}{" "}
                  <span className="text-sm font-medium text-gray-400">{sourceName}</span>
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Recipient Gets</p>
                <p className="text-lg font-bold text-emerald-400">
                  {destAmount !== "0"
                    ? (parseInt(destAmount) / 1_000_000).toFixed(2)
                    : "0"}{" "}
                  <span className="text-sm font-medium text-gray-400">{destName}</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <DetailRow label="From" value={wallet.shortAddress} mono />
              <DetailRow label="To" value={truncateAddress(store.recipientAddress, 8)} mono />
              <DetailRow
                label="Exchange Rate"
                value={`1 ${sourceName} = ${formatRate(store.exchangeRate)} ${destName}`}
              />
              <DetailRow label="Fee" value={formatFee(store.feeBps)} />
              <DetailRow
                label="Network"
                value={
                  <div className="flex items-center gap-1.5">
                    <Network className="h-3 w-3" />
                    Stellar Testnet
                  </div>
                }
              />
              <DetailRow
                label="KYC Status"
                value={
                  store.kycVerified ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <FileCheck className="h-3 w-3" />
                      Pending
                    </div>
                  )
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="success"
            onClick={onConfirm}
            loading={loading}
            disabled={!store.kycVerified}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm & Sign
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={`text-sm text-gray-300 ${mono ? "font-mono" : ""} flex items-center gap-1`}
      >
        {value}
      </span>
    </div>
  );
}

export { ReviewTransfer };
