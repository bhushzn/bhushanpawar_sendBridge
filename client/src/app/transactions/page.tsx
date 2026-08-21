"use client";

import { TransactionTable } from "@/components/transactions/transaction-table";
import { ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-cyan-400" />
          Transaction History
        </h1>
        <p className="text-gray-400 mt-1">
          View all your cross-border transfers
        </p>
      </div>

      <TransactionTable />
    </div>
  );
}
