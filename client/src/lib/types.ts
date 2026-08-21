export interface TransferRecord {
  id?: number;
  status?: string;
  source_amount?: string;
  dest_amount?: string;
  source_asset?: string;
  dest_asset?: string;
  created_at?: number;
  sender?: string;
  recipient?: string;
  exchange_rate?: number;
  fee_bps?: number;
}
