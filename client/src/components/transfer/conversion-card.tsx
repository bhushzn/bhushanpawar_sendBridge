"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatFee } from "@/lib/stellar/format";
import { ArrowRight, TrendingUp, Minus } from "lucide-react";

interface ConversionCardProps {
  sourceAmount: string;
  destAmount: string;
  exchangeRate: number;
  feeBps: number;
  sourceAsset: string;
  destAsset: string;
}

function ConversionCard({
  sourceAmount,
  destAmount,
  exchangeRate,
  feeBps,
  sourceAsset,
  destAsset,
}: ConversionCardProps) {
  return (
    <Card className="bg-white/[0.03] border-white/[0.07]">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Source Amount</span>
          <span className="text-sm text-white font-medium">
            {sourceAmount || "0"} {sourceAsset}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-mono">
            1 {sourceAsset} = {exchangeRate > 0 ? (exchangeRate / 1_000_000).toFixed(6) : "—"}{" "}
            {destAsset}
          </span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Network Fee</span>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Minus className="h-3 w-3" />
            {formatFee(feeBps)}
          </span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Recipient Gets</span>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">
              {destAmount || "0"}
            </span>
            <span className="text-sm text-gray-400">{destAsset}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { ConversionCard };
