import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL } from "./config";

let serverInstance: rpc.Server | null = null;

export function getServer(): rpc.Server {
  if (!serverInstance) {
    serverInstance = new rpc.Server(RPC_URL);
  }
  return serverInstance;
}
