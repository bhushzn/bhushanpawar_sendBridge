"use client";

import * as React from "react";
import Link from "next/link";
import { useRecentTransfers, useTransferCount } from "@/hooks/use-contract";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransferRecord } from "@/lib/types";
import {
  formatTimestamp,
  truncateAddress,
} from "@/lib/stellar/format";
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  ExternalLink,
  Inbox,
  Filter,
} from "lucide-react";

const STATUS_FILTERS = ["All", "Pending", "Processing", "Completed", "Failed", "Cancelled"];

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "outline"> = {
  Pending: "warning",
  Processing: "default",
  Completed: "success",
  Failed: "danger",
  Cancelled: "outline",
};

function TransactionTable() {
  const { data: count } = useTransferCount();
  const { data: transfers, isLoading, refetch, isFetching } = useRecentTransfers(50);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const filtered = React.useMemo(() => {
    if (!transfers) return [];
    return transfers.filter((t: TransferRecord) => {
      const matchesSearch =
        !search ||
        String(t.id).includes(search) ||
        (t.sender && t.sender.toLowerCase().includes(search.toLowerCase())) ||
        (t.recipient && t.recipient.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, search, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-cyan-400" />
            Transactions
            {count !== undefined && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                {count} total
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === f
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-600/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mb-3">
              <Inbox className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No transactions found</p>
            <p className="text-xs text-gray-600 mt-1">
              {search || statusFilter !== "All"
                ? "Try adjusting your filters."
                : "Your transactions will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      ID
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      From → To
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      Fee
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: TransferRecord) => (
                    <tr
                      key={t.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="text-sm font-mono text-gray-300">
                          #{t.id}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-gray-400">
                          {t.created_at ? formatTimestamp(t.created_at) : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-gray-300 font-mono">
                          {t.sender ? truncateAddress(t.sender, 4) : "—"}
                        </span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="text-sm text-gray-300 font-mono">
                          {t.recipient ? truncateAddress(t.recipient, 4) : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-white font-medium">
                          {t.source_amount
                            ? (parseInt(t.source_amount) / 1_000_000).toFixed(2)
                            : "—"}{" "}
                          <span className="text-gray-500 text-xs">
                            {t.source_asset || ""}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-gray-500">
                          {t.fee_bps ? `${(t.fee_bps / 100).toFixed(2)}%` : "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}
                          className="text-[10px]"
                        >
                          {t.status || "Unknown"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/transactions/${t.id}`}
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((t: TransferRecord) => (
                <Link key={t.id} href={`/transactions/${t.id}`}>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 hover:bg-white/[0.06] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-300">
                        #{t.id}
                      </span>
                      <Badge
                        variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}
                        className="text-[10px]"
                      >
                        {t.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="text-sm text-white">
                      {t.source_amount
                        ? (parseInt(t.source_amount) / 1_000_000).toFixed(2)
                        : "—"}{" "}
                      <span className="text-gray-500">{t.source_asset}</span>
                      <span className="text-gray-600 mx-1">→</span>
                      {t.dest_amount
                        ? (parseInt(t.dest_amount) / 1_000_000).toFixed(2)
                        : "—"}{" "}
                      <span className="text-gray-500">{t.dest_asset}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t.created_at ? formatTimestamp(t.created_at) : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { TransactionTable };
