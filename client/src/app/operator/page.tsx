"use client";

import * as React from "react";
import { OperatorPanel } from "@/components/operator/operator-panel";
import { Shield, Sparkles } from "lucide-react";

export default function OperatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">
          <Shield className="h-4 w-4" />
          Protocol Administration
        </div>
        <h1 className="text-3xl font-bold">Bridge Operator Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Manage currency corridors, oracle exchange rates, compliance attestations, and settlement queues.
        </p>
      </div>

      <OperatorPanel />
    </div>
  );
}
