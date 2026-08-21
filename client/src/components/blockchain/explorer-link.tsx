"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  getAccountExplorerUrl,
  getTransactionExplorerUrl,
  getContractExplorerUrl,
} from "@/lib/stellar/explorer";
import { truncateAddress } from "@/lib/stellar/format";
import { ExternalLink, Copy, Check } from "lucide-react";

type ExplorerLinkType = "account" | "tx" | "contract";

interface ExplorerLinkProps {
  value: string;
  type: ExplorerLinkType;
  truncate?: number;
  showCopy?: boolean;
  className?: string;
}

const URL_MAP: Record<ExplorerLinkType, (value: string) => string> = {
  account: getAccountExplorerUrl,
  tx: getTransactionExplorerUrl,
  contract: getContractExplorerUrl,
};

function ExplorerLink({
  value,
  type,
  truncate: truncateChars = 8,
  showCopy = true,
  className,
}: ExplorerLinkProps) {
  const [copied, setCopied] = React.useState(false);
  const url = URL_MAP[type](value);
  const display = truncateChars > 0 ? truncateAddress(value, truncateChars) : value;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
      >
        {display}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export { ExplorerLink };
