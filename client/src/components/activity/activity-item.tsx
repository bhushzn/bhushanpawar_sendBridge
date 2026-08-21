"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TransferRecord } from "@/lib/types";
import { formatTimestamp, truncateAddress } from "@/lib/stellar/format";
import {
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Cog,
} from "lucide-react";

interface ActivityItemProps {
  transfer: TransferRecord;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-4 w-4 text-amber-400" />,
  Processing: <Cog className="h-4 w-4 text-cyan-400 animate-spin" />,
  Completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  Failed: <XCircle className="h-4 w-4 text-red-400" />,
  Cancelled: <Ban className="h-4 w-4 text-gray-400" />,
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "outline"> = {
  Pending: "warning",
  Processing: "default",
  Completed: "success",
  Failed: "danger",
  Cancelled: "outline",
};

function ActivityItem({ transfer }: ActivityItemProps) {
  const status = transfer.status || "Pending";
  const icon = STATUS_ICONS[status] || <Clock className="h-4 w-4 text-gray-400" />;
  const variant = STATUS_VARIANTS[status] || "outline";

  const sourceAmt = transfer.source_amount
    ? (parseInt(transfer.source_amount) / 1_000_000).toFixed(2)
    : "—";
  const destAmt = transfer.dest_amount
    ? (parseInt(transfer.dest_amount) / 1_000_000).toFixed(2)
    : "—";

  const timeAgo = transfer.created_at
    ? getTimeAgo(transfer.created_at)
    : "";

  return (
    <Link href={`/transfer/${transfer.id ?? ""}`}>
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group cursor-pointer">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {transfer.id !== undefined && (
              <span className="text-xs text-gray-500 font-mono">
                #{transfer.id}
              </span>
            )}
            <span className="text-sm text-white truncate">
              {sourceAmt} {transfer.source_asset || "—"}
              <ArrowUpRight className="inline h-3 w-3 text-gray-600 mx-1" />
              {destAmt} {transfer.dest_asset || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {transfer.recipient && (
              <span className="text-[11px] text-gray-500 font-mono">
                {truncateAddress(transfer.recipient, 4)}
              </span>
            )}
            {timeAgo && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-[11px] text-gray-500">{timeAgo}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant={variant} className="flex-shrink-0 text-[10px]">
          {status}
        </Badge>
      </div>
    </Link>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(timestamp);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatTimestamp(timestamp);
}

export { ActivityItem };
