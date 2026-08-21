"use client";

import * as React from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTransferStore } from "@/lib/stores/transfer-store";
import { useExchangeRate, useFeeBps } from "@/hooks/use-contract";
import { AmountInput } from "@/components/transfer/amount-input";
import { ConversionCard } from "@/components/transfer/conversion-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ASSETS, type AssetCode } from "@/lib/stellar/assets";
import { formatRate } from "@/lib/stellar/format";
import {
  ArrowDownUp,
  Shield,
  ShieldCheck,
  Send,
  Wallet,
} from "lucide-react";

const ASSET_OPTIONS = Object.values(ASSETS).map((a) => ({
  value: a.code,
  label: `${a.flag} ${a.name} (${a.symbol})`,
}));


function SendForm({ onReview }: { onReview: () => void }) {
  const wallet = useWallet();
  const store = useTransferStore();

  const { data: exchangeRate } = useExchangeRate(
    store.sourceAsset,
    store.destAsset
  );
  const { data: feeBps } = useFeeBps();

  React.useEffect(() => {
    if (exchangeRate !== undefined) store.setExchangeRate(exchangeRate);
    if (feeBps !== undefined) store.setFeeBps(feeBps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeRate, feeBps]);

  const swapAssets = () => {
    const src = store.sourceAsset;
    const dst = store.destAsset;
    store.setSourceAsset(dst);
    store.setDestAsset(src);
  };

  const destAmount = store.getDestAmount();

  const canReview =
    wallet.isConnected &&
    store.sourceAmount &&
    parseFloat(store.sourceAmount) > 0 &&
    store.recipientAddress &&
    store.kycVerified;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-cyan-400" />
            Send Remittance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!wallet.isConnected && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-600/10 border border-amber-600/20 px-4 py-3">
              <Wallet className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-400">
                Connect your wallet to start sending remittances.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                You Send
              </h3>
              <Select
                options={ASSET_OPTIONS}
                value={store.sourceAsset}
                onChange={(e) => store.setSourceAsset(e.target.value)}
                className="w-auto h-8 text-xs rounded-lg bg-white/5 border-white/10"
              />
            </div>
            <AmountInput
              value={store.sourceAmount}
              onChange={store.setSourceAmount}
              assetCode={
                ASSETS[store.sourceAsset as AssetCode]?.name || store.sourceAsset
              }
              disabled={!wallet.isConnected}
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={swapAssets}
              className="rounded-xl bg-white/5 border border-white/10 p-2 hover:bg-white/10 hover:border-cyan-400/30 transition-all group"
            >
              <ArrowDownUp className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recipient Gets
              </h3>
              <Select
                options={ASSET_OPTIONS}
                value={store.destAsset}
                onChange={(e) => store.setDestAsset(e.target.value)}
                className="w-auto h-8 text-xs rounded-lg bg-white/5 border-white/10"
              />
            </div>
            <Input
              placeholder="Recipient Stellar address"
              value={store.recipientAddress}
              onChange={(e) => store.setRecipientAddress(e.target.value)}
              disabled={!wallet.isConnected}
              className="font-mono text-sm"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {store.kycVerified ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">KYC Verified</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    KYC Required
                  </span>
                </>
              )}
            </div>
            {exchangeRate !== undefined && (
              <div className="text-right">
                <span className="text-xs text-gray-500">Rate </span>
                <span className="text-sm text-white font-mono">
                  {formatRate(exchangeRate)}
                </span>
              </div>
            )}
          </div>

          {store.sourceAmount && parseFloat(store.sourceAmount) > 0 && (
            <ConversionCard
              sourceAmount={store.sourceAmount}
              destAmount={
                destAmount !== "0"
                  ? (parseInt(destAmount) / 1_000_000).toFixed(2)
                  : "0"
              }
              exchangeRate={exchangeRate || 0}
              feeBps={feeBps || store.feeBps}
              sourceAsset={
                ASSETS[store.sourceAsset as AssetCode]?.name ||
                store.sourceAsset
              }
              destAsset={
                ASSETS[store.destAsset as AssetCode]?.name ||
                store.destAsset
              }
            />
          )}

          <Button
            onClick={onReview}
            disabled={!canReview}
            className="w-full"
            size="lg"
          >
            <Send className="h-4 w-4" />
            Review Transfer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export { SendForm };
