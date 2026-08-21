const BASE_URL = "https://stellar.expert/explorer/testnet";

export function getAccountExplorerUrl(address: string): string {
  return `${BASE_URL}/account/${address}`;
}

export function getTransactionExplorerUrl(hash: string): string {
  return `${BASE_URL}/tx/${hash}`;
}

export function getContractExplorerUrl(contractId: string): string {
  return `${BASE_URL}/contract/${contractId}`;
}
