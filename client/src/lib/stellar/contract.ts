import {
  rpc,
  Contract,
  Address,
  TransactionBuilder,
  Account,
  Transaction,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { getServer } from "./network";
import { NETWORK_PASSPHRASE, CONTRACT_ADDRESS as DEFAULT_CONTRACT_ADDRESS } from "./config";
import { SimulationError } from "./errors";
import { getDefaultExchangeRate, ASSETS } from "./assets";
import { DEMO_ACCOUNTS } from "./wallet/stellar-wallet";

export interface TransferData {
  id: number;
  sender: string;
  recipient: string;
  source_asset: string;
  dest_asset: string;
  source_amount: string;
  dest_amount: string;
  exchange_rate: number;
  fee_bps: number;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface KycInfo {
  verified: boolean;
  attestation_hash: string;
  verified_at: number;
}

// ─── LOCAL STATE STORAGE (Fallback / Demo Simulator) ─────────────────────────

const LOCAL_STORAGE_STATE_KEY = "sendbridge_simulated_contract_state_v1";

interface SimulatedContractState {
  admin: string;
  operator: string;
  feeBps: number;
  exchangeRates: Record<string, number>;
  kycRegistry: Record<string, KycInfo>;
  transfers: TransferData[];
  transferCount: number;
}

function getInitialState(): SimulatedContractState {
  const now = Math.floor(Date.now() / 1000);
  const alice = DEMO_ACCOUNTS[0].address;
  const bob = DEMO_ACCOUNTS[1].address;
  const carol = DEMO_ACCOUNTS[2].address;

  // Pre-configured exchange rates for key corridors
  const initialRates: Record<string, number> = {
    "SB_INR:SB_USD": getDefaultExchangeRate("SB_INR", "SB_USD"),
    "SB_USD:SB_INR": getDefaultExchangeRate("SB_USD", "SB_INR"),
    "SB_EUR:SB_USD": getDefaultExchangeRate("SB_EUR", "SB_USD"),
    "SB_USD:SB_EUR": getDefaultExchangeRate("SB_USD", "SB_EUR"),
    "SB_GBP:SB_USD": getDefaultExchangeRate("SB_GBP", "SB_USD"),
    "SB_USD:SB_GBP": getDefaultExchangeRate("SB_USD", "SB_GBP"),
    "SB_USD:SB_PHP": getDefaultExchangeRate("SB_USD", "SB_PHP"),
    "SB_USD:SB_AED": getDefaultExchangeRate("SB_USD", "SB_AED"),
    "SB_USD:SB_BRL": getDefaultExchangeRate("SB_USD", "SB_BRL"),
  };

  // Seed with realistic demo transfers
  const initialTransfers: TransferData[] = [
    {
      id: 0,
      sender: alice,
      recipient: "GDEMORECIPIENT1MUMBAIINDIA9876543210ABCDEF1234",
      source_asset: "SB_USD",
      dest_asset: "SB_INR",
      source_amount: "500000000", // 500.00 USD (micro)
      dest_amount: "41458333333", // ~41,458.33 INR
      exchange_rate: Math.round((1.0 / 0.012) * 1_000_000),
      fee_bps: 50,
      status: "Completed",
      created_at: now - 86400 * 2,
      updated_at: now - 86400 * 2 + 180,
    },
    {
      id: 1,
      sender: alice,
      recipient: "GDEMORECIPIENT2MANILAPHILIPPINES9876543210AB",
      source_asset: "SB_USD",
      dest_asset: "SB_PHP",
      source_amount: "250000000", // 250.00 USD
      dest_amount: "14214285714", // ~14,214.28 PHP
      exchange_rate: Math.round((1.0 / 0.0175) * 1_000_000),
      fee_bps: 50,
      status: "Processing",
      created_at: now - 3600 * 3,
      updated_at: now - 3600 * 2,
    },
    {
      id: 2,
      sender: "GCSENDEROTHERUSERTESTNETWALLETSAMPLE77777777",
      recipient: alice,
      source_asset: "SB_EUR",
      dest_asset: "SB_USD",
      source_amount: "1000000000", // 1000.00 EUR
      dest_amount: "1074600000", // ~1074.60 USD
      exchange_rate: Math.round((1.08 / 1.0) * 1_000_000),
      fee_bps: 50,
      status: "Pending",
      created_at: now - 1800,
      updated_at: now - 1800,
    },
  ];

  return {
    admin: carol,
    operator: bob,
    feeBps: 50,
    exchangeRates: initialRates,
    kycRegistry: {
      [alice]: {
        verified: true,
        attestation_hash: "0x3f4a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
        verified_at: now - 86400 * 5,
      },
    },
    transfers: initialTransfers,
    transferCount: initialTransfers.length,
  };
}

function loadSimulatedState(): SimulatedContractState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (!raw) {
      const initial = getInitialState();
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as SimulatedContractState;
  } catch {
    return getInitialState();
  }
}

function saveSimulatedState(state: SimulatedContractState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable
  }
}

// ─── RPC SIMULATION & LIVE DISPATCH ──────────────────────────────────────────

function isLiveContractConfigured(contractId?: string): boolean {
  const id = contractId || DEFAULT_CONTRACT_ADDRESS;
  return Boolean(id && id.trim().length >= 50 && id.startsWith("C"));
}

function extractRetVal(
  result: rpc.Api.SimulateTransactionSuccessResponse,
): xdr.ScVal {
  if (!result.result?.retval) {
    throw new SimulationError("No return value in simulation result.");
  }
  return result.result.retval;
}

async function simulateReadOnly(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<rpc.Api.SimulateTransactionSuccessResponse> {
  const server = getServer();
  const contract = new Contract(contractId);

  const account = await server.getAccount(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(result)) {
    throw new SimulationError(
      result.error ?? `Simulation failed for ${method}.`,
    );
  }

  return result as rpc.Api.SimulateTransactionSuccessResponse;
}

function decodeContractString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val instanceof Uint8Array) {
    return new TextDecoder().decode(val);
  }
  if (val && typeof val === "object" && "toString" in val) {
    return String(val);
  }
  return String(val ?? "");
}

function extractStatus(statusVal: unknown): string {
  if (typeof statusVal === "string") return statusVal;

  if (typeof statusVal === "number") {
    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Processing",
      2: "Completed",
      3: "Cancelled",
      4: "Failed",
    };
    return statusMap[statusVal] ?? "Unknown";
  }

  if (statusVal && typeof statusVal === "object" && "tag" in statusVal) {
    return String((statusVal as { tag: string }).tag);
  }

  return String(statusVal ?? "Unknown");
}

// ─── READ-ONLY CONTRACT CALLS ───────────────────────────────────────────────

export async function getOperator(contractId?: string): Promise<string> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const result = await simulateReadOnly(contractId!, "get_operator", []);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      return decodeContractString(scValToNative(extractRetVal(result)));
    } catch {
      // fallback to simulator if RPC simulation fails
    }
  }
  const state = loadSimulatedState();
  return state.operator;
}

export async function getFeeBps(contractId?: string): Promise<number> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const result = await simulateReadOnly(contractId!, "get_fee_bps", []);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      return Number(scValToNative(extractRetVal(result)));
    } catch {
      // fallback to simulator
    }
  }
  const state = loadSimulatedState();
  return state.feeBps;
}

export async function getExchangeRate(
  contractId: string | undefined,
  sourceAsset: string,
  destAsset: string,
): Promise<number> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const args: xdr.ScVal[] = [
        nativeToScVal(sourceAsset, { type: "symbol" }),
        nativeToScVal(destAsset, { type: "symbol" }),
      ];
      const result = await simulateReadOnly(contractId!, "get_exchange_rate", args);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      return Number(scValToNative(extractRetVal(result)));
    } catch {
      // fallback to simulator
    }
  }
  const state = loadSimulatedState();
  const key = `${sourceAsset}:${destAsset}`;
  if (state.exchangeRates[key] !== undefined) {
    return state.exchangeRates[key];
  }
  return getDefaultExchangeRate(sourceAsset, destAsset);
}

export async function isKycVerified(
  contractId: string | undefined,
  wallet: string,
): Promise<boolean> {
  if (!wallet) return false;
  if (isLiveContractConfigured(contractId)) {
    try {
      const args: xdr.ScVal[] = [new Address(wallet).toScVal()];
      const result = await simulateReadOnly(contractId!, "is_kyc_verified", args);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      return Boolean(scValToNative(extractRetVal(result)));
    } catch {
      // fallback
    }
  }
  const state = loadSimulatedState();
  return Boolean(state.kycRegistry[wallet]?.verified);
}

export async function getKyc(
  contractId: string | undefined,
  wallet: string,
): Promise<KycInfo | null> {
  if (!wallet) return null;
  const state = loadSimulatedState();
  return state.kycRegistry[wallet] ?? null;
}

export async function getTransfer(
  contractId: string | undefined,
  id: number,
): Promise<TransferData> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const args: xdr.ScVal[] = [nativeToScVal(id, { type: "u32" })];
      const result = await simulateReadOnly(contractId!, "get_transfer", args);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      const raw = scValToNative(extractRetVal(result)) as Record<string, unknown>;

      return {
        id: Number(raw.id ?? 0),
        sender: decodeContractString(raw.sender),
        recipient: decodeContractString(raw.recipient),
        source_asset: decodeContractString(raw.source_asset ?? raw.sourceAsset),
        dest_asset: decodeContractString(raw.dest_asset ?? raw.destAsset),
        source_amount: String(raw.source_amount ?? raw.sourceAmount ?? "0"),
        dest_amount: String(raw.dest_amount ?? raw.destAmount ?? "0"),
        exchange_rate: Number(raw.exchange_rate ?? raw.exchangeRate ?? 0),
        fee_bps: Number(raw.fee_bps ?? raw.feeBps ?? 0),
        status: extractStatus(raw.status),
        created_at: Number(raw.created_at ?? raw.createdAt ?? 0),
        updated_at: Number(raw.updated_at ?? raw.updatedAt ?? 0),
      };
    } catch {
      // fallback
    }
  }
  const state = loadSimulatedState();
  const transfer = state.transfers.find((t) => t.id === id);
  if (!transfer) {
    throw new Error(`Transfer #${id} not found`);
  }
  return transfer;
}

export async function getTransferCount(contractId?: string): Promise<number> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const result = await simulateReadOnly(contractId!, "get_transfer_count", []);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      return Number(scValToNative(extractRetVal(result)));
    } catch {
      // fallback
    }
  }
  const state = loadSimulatedState();
  return state.transferCount;
}

export async function getTransferStatus(
  contractId: string | undefined,
  id: number,
): Promise<string> {
  const transfer = await getTransfer(contractId, id);
  return transfer.status;
}

export async function getRecentTransfers(
  contractId: string | undefined,
  count: number,
): Promise<TransferData[]> {
  if (isLiveContractConfigured(contractId)) {
    try {
      const args: xdr.ScVal[] = [nativeToScVal(count, { type: "u32" })];
      const result = await simulateReadOnly(contractId!, "get_recent_transfers", args);
      const { scValToNative } = await import("@stellar/stellar-sdk");
      const raw = scValToNative(extractRetVal(result)) as Record<string, unknown>[];

      if (Array.isArray(raw)) {
        return raw.map((item) => ({
          id: Number(item.id ?? 0),
          sender: decodeContractString(item.sender),
          recipient: decodeContractString(item.recipient),
          source_asset: decodeContractString(item.source_asset ?? item.sourceAsset),
          dest_asset: decodeContractString(item.dest_asset ?? item.destAsset),
          source_amount: String(item.source_amount ?? item.sourceAmount ?? "0"),
          dest_amount: String(item.dest_amount ?? item.destAmount ?? "0"),
          exchange_rate: Number(item.exchange_rate ?? item.exchangeRate ?? 0),
          fee_bps: Number(item.fee_bps ?? item.feeBps ?? 0),
          status: extractStatus(item.status),
          created_at: Number(item.created_at ?? item.createdAt ?? 0),
          updated_at: Number(item.updated_at ?? item.updatedAt ?? 0),
        }));
      }
    } catch {
      // fallback
    }
  }
  const state = loadSimulatedState();
  return [...state.transfers]
    .sort((a, b) => b.id - a.id)
    .slice(0, count);
}

// ─── STATE MUTATIONS (Dual Mode: Live XDR & Simulated Execution) ────────────

export async function executeSimulatedCreateTransfer(params: {
  sender: string;
  recipient: string;
  sourceAsset: string;
  destAsset: string;
  sourceAmount: string;
  destAmount: string;
  exchangeRate: number;
  feeBps: number;
}): Promise<{ id: number; hash: string }> {
  const state = loadSimulatedState();
  const id = state.transferCount;
  const now = Math.floor(Date.now() / 1000);

  const newTransfer: TransferData = {
    id,
    sender: params.sender,
    recipient: params.recipient,
    source_asset: params.sourceAsset,
    dest_asset: params.destAsset,
    source_amount: params.sourceAmount,
    dest_amount: params.destAmount,
    exchange_rate: params.exchangeRate,
    fee_bps: params.feeBps,
    status: "Pending",
    created_at: now,
    updated_at: now,
  };

  state.transfers.unshift(newTransfer);
  state.transferCount += 1;
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { id, hash };
}

export async function executeSimulatedUpdateStatus(
  id: number,
  newStatus: string,
): Promise<{ hash: string }> {
  const state = loadSimulatedState();
  const transfer = state.transfers.find((t) => t.id === id);
  if (!transfer) {
    throw new Error(`Transfer #${id} not found`);
  }

  transfer.status = newStatus;
  transfer.updated_at = Math.floor(Date.now() / 1000);
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash };
}

export async function executeSimulatedCancelTransfer(
  id: number,
  sender: string,
): Promise<{ hash: string }> {
  const state = loadSimulatedState();
  const transfer = state.transfers.find((t) => t.id === id);
  if (!transfer) {
    throw new Error(`Transfer #${id} not found`);
  }
  if (transfer.sender.toLowerCase() !== sender.toLowerCase()) {
    throw new Error("Only the sender can cancel this transfer");
  }
  if (transfer.status !== "Pending") {
    throw new Error("Only pending transfers can be cancelled");
  }

  transfer.status = "Cancelled";
  transfer.updated_at = Math.floor(Date.now() / 1000);
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash };
}

export async function executeSimulatedSetKyc(
  wallet: string,
  attestationHash: string,
): Promise<{ hash: string }> {
  const state = loadSimulatedState();
  state.kycRegistry[wallet] = {
    verified: true,
    attestation_hash: attestationHash,
    verified_at: Math.floor(Date.now() / 1000),
  };
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash };
}

export async function executeSimulatedSetExchangeRate(
  sourceAsset: string,
  destAsset: string,
  rate: number,
): Promise<{ hash: string }> {
  const state = loadSimulatedState();
  state.exchangeRates[`${sourceAsset}:${destAsset}`] = rate;
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash };
}

export async function executeSimulatedSetFeeBps(
  feeBps: number,
): Promise<{ hash: string }> {
  const state = loadSimulatedState();
  state.feeBps = feeBps;
  saveSimulatedState(state);

  const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { hash };
}

// ─── WRITE CONTRACT CALLS (XDR builders for live testnet) ──────────────────

export async function buildCreateTransfer(
  contractId: string,
  sender: string,
  recipient: string,
  sourceAsset: string,
  destAsset: string,
  sourceAmount: bigint,
  destAmount: bigint,
  exchangeRate: number,
  feeBps: number,
  account: Account,
): Promise<Transaction> {
  const args: xdr.ScVal[] = [
    new Address(sender).toScVal(),
    new Address(recipient).toScVal(),
    nativeToScVal(sourceAsset, { type: "symbol" }),
    nativeToScVal(destAsset, { type: "symbol" }),
    nativeToScVal(sourceAmount, { type: "i128" }),
    nativeToScVal(destAmount, { type: "i128" }),
    nativeToScVal(exchangeRate, { type: "u64" }),
    nativeToScVal(feeBps, { type: "u32" }),
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("create_transfer", ...args))
    .setTimeout(60)
    .build();

  return tx;
}

export async function buildSetKycAttestation(
  contractId: string,
  caller: string,
  wallet: string,
  attestationHash: string,
  account: Account,
): Promise<Transaction> {
  const cleanHash = attestationHash.startsWith("0x") ? attestationHash.slice(2) : attestationHash;
  const hashBytes = Buffer.from(cleanHash.padEnd(64, "0").slice(0, 64), "hex");
  const args: xdr.ScVal[] = [
    new Address(caller).toScVal(),
    new Address(wallet).toScVal(),
    nativeToScVal(hashBytes, { type: "bytes" }),
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("set_kyc_attestation", ...args))
    .setTimeout(60)
    .build();

  return tx;
}

export async function buildSetExchangeRate(
  contractId: string,
  caller: string,
  sourceAsset: string,
  destAsset: string,
  rate: number,
  account: Account,
): Promise<Transaction> {
  const args: xdr.ScVal[] = [
    new Address(caller).toScVal(),
    nativeToScVal(sourceAsset, { type: "symbol" }),
    nativeToScVal(destAsset, { type: "symbol" }),
    nativeToScVal(rate, { type: "u64" }),
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("set_exchange_rate", ...args))
    .setTimeout(60)
    .build();

  return tx;
}

export async function buildSetFeeBps(
  contractId: string,
  caller: string,
  feeBps: number,
  account: Account,
): Promise<Transaction> {
  const args: xdr.ScVal[] = [
    new Address(caller).toScVal(),
    nativeToScVal(feeBps, { type: "u32" }),
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("set_fee_bps", ...args))
    .setTimeout(60)
    .build();

  return tx;
}

export async function buildUpdateTransferStatus(
  contractId: string,
  caller: string,
  id: number,
  newStatus: string,
  account: Account,
): Promise<Transaction> {
  const statusMap: Record<string, xdr.ScVal> = {
    Pending: nativeToScVal(0, { type: "u32" }),
    Processing: nativeToScVal(1, { type: "u32" }),
    Completed: nativeToScVal(2, { type: "u32" }),
    Cancelled: nativeToScVal(3, { type: "u32" }),
    Failed: nativeToScVal(4, { type: "u32" }),
  };

  const statusScVal = statusMap[newStatus] ?? nativeToScVal(0, { type: "u32" });

  const args: xdr.ScVal[] = [
    new Address(caller).toScVal(),
    nativeToScVal(id, { type: "u32" }),
    statusScVal,
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("update_transfer_status", ...args))
    .setTimeout(60)
    .build();

  return tx;
}

export async function buildCancelTransfer(
  contractId: string,
  sender: string,
  id: number,
  account: Account,
): Promise<Transaction> {
  const args: xdr.ScVal[] = [
    new Address(sender).toScVal(),
    nativeToScVal(id, { type: "u32" }),
  ];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("cancel_transfer", ...args))
    .setTimeout(60)
    .build();

  return tx;
}
