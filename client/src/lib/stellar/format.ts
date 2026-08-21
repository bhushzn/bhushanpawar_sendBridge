export function truncateAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatAmount(
  amount: bigint | number | string | undefined | null,
  decimals = 6,
): string {
  if (amount === undefined || amount === null) return "0.00";
  
  if (typeof amount === "string" && amount.includes(".")) {
    const num = parseFloat(amount);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  try {
    const big = typeof amount === "string" ? BigInt(amount) : typeof amount === "number" ? BigInt(Math.round(amount)) : amount;
    const divisor = BigInt(10 ** decimals);
    const whole = big / divisor;
    const fraction = big % divisor;

    const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
    if (fractionStr.length === 0) {
      return `${whole.toLocaleString("en-US")}.00`;
    }
    const displayFraction = fractionStr.length === 1 ? `${fractionStr}0` : fractionStr.slice(0, 4);
    return `${whole.toLocaleString("en-US")}.${displayFraction}`;
  } catch {
    const num = parseFloat(String(amount));
    return isNaN(num) ? "0.00" : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
}


export function formatFee(feeBps: number): string {
  const pct = (feeBps / 100).toFixed(2);
  return `${pct}%`;
}

export function formatTimestamp(ts: number): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRate(rate: number, precision = 1_000_000): string {
  return (rate / precision).toFixed(6);
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-800",
  Failed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Failed: "Failed",
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
