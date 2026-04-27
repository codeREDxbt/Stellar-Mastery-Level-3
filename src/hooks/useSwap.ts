import { 
  rpc, 
  Networks, 
  TransactionBuilder, 
  Address, 
  xdr, 
  scValToNative, 
  nativeToScVal,
  Account,
  Operation,
  StrKey,
  Asset,
  Contract
} from "@stellar/stellar-sdk";
import { useState, useCallback } from "react";

export type TxStatus = "IDLE" | "PENDING" | "SUCCESS" | "FAILED";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

// Standard Testnet Asset Contract IDs
const TOKEN_CONTRACTS: Record<string, string> = {
  USDC: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
};

export interface OrderData {
  id: number;
  seller: string;
  sellToken: string;
  buyToken: string;
  sellAmount: bigint;
  buyPrice: bigint;
}

export function useSwap(address: string | null, sign: (xdr: string) => Promise<string>) {
  const [status, setStatus] = useState<TxStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (): Promise<OrderData[]> => {
    if (!CONTRACT_ID || !address) return [];
    
    try {
      const contract = new Contract(CONTRACT_ID);
      
      // 1. Get Count via simulation
      const tx = new TransactionBuilder(new Account(address, "0"), {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(contract.call("get_order_count"))
      .setTimeout(0)
      .build();

      const sim = await server.simulateTransaction(tx) as any;
      const result = sim.results ? sim.results[0] : sim.result;
      
      if (!result) return [];
      
      const count = Number(scValToNative(result.retval || result.xdr.value()));
      const orders: OrderData[] = [];

      for (let i = 1; i <= count; i++) {
        const orderTx = new TransactionBuilder(new Account(address, "0"), {
          fee: "100",
          networkPassphrase: Networks.TESTNET,
        })
        .addOperation(contract.call("get_order", nativeToScVal(i, { type: "u64" })))
        .setTimeout(0)
        .build();

        const orderSim = await server.simulateTransaction(orderTx) as any;
        const orderResult = orderSim.results ? orderSim.results[0] : orderSim.result;
        
        if (orderResult) {
          const rawOrder = scValToNative(orderResult.retval || orderResult.xdr.value());
          if (rawOrder) {
            orders.push({
              id: i,
              seller: rawOrder.seller,
              sellToken: rawOrder.sell_token,
              buyToken: rawOrder.buy_token,
              sellAmount: rawOrder.sell_amount,
              buyPrice: rawOrder.buy_price
            });
          }
        }
      }
      return orders;
    } catch (e) {
      console.error("Fetch Orders Error:", e);
      return [];
    }
  }, [address]);

  const placeOrder = useCallback(async (
    sellTokenName: string,
    buyTokenName: string,
    sellAmount: bigint,
    buyPrice: bigint
  ) => {
    if (!address || !CONTRACT_ID) {
      setError("System Configuration Error: Wallet or Contract ID missing.");
      return;
    }

    const sellTokenAddr = TOKEN_CONTRACTS[sellTokenName];
    const buyTokenAddr = TOKEN_CONTRACTS[buyTokenName];

    if (!sellTokenAddr || !buyTokenAddr) {
      setError(`Invalid Token Selection: ${sellTokenName} or ${buyTokenName} not supported.`);
      return;
    }

    setStatus("PENDING");
    setError(null);

    try {
      // 1. Pre-flight check (Balance Check)
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
      const accountResponse = await fetch(`${horizonUrl}/accounts/${address}`);
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        
        // XLM Fee check
        const xlmBalance = parseFloat(accountData.balances.find((b: any) => b.asset_type === 'native')?.balance || "0");
        if (xlmBalance < 2) {
          throw new Error("Insufficient XLM Balance: You need at least 2 XLM to cover transaction fees.");
        }

        // Sell Asset Balance Check
        if (sellTokenName === "USDC") {
          const usdcBalance = parseFloat(accountData.balances.find((b: any) => b.asset_code === 'USDC')?.balance || "0");
          if (usdcBalance < Number(sellAmount) / 1e7) {
            throw new Error(`Insufficient ${sellTokenName} Balance.`);
          }
        }
      }

      // 2. Prepare Transaction
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, {
        fee: "20000", // Buffer for Soroban
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(
              new xdr.InvokeContractArgs({
                contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
                functionName: xdr.ScVal.scvSymbol("place_order").sym(),
                args: [
                  nativeToScVal(Address.fromString(address), { type: "address" }),
                  nativeToScVal(Address.fromString(sellTokenAddr), { type: "address" }),
                  nativeToScVal(Address.fromString(buyTokenAddr), { type: "address" }),
                  nativeToScVal(sellAmount, { type: "i128" }),
                  nativeToScVal(buyPrice, { type: "i128" }),
                ],
              })
            ),
            auth: [],
          })
        )
        .setTimeout(300)
        .build();

      // 3 & 4. Prepare & Sign
      console.log("Preparing and signing transaction...");
      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await sign(preparedTx.toXDR());

      // 5. Submit
      console.log("Broadcasting to Soroban RPC...");
      const finalTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const sendResponse = await server.sendTransaction(finalTx as any);
      
      if (sendResponse.status === "ERROR") {
        throw new Error(`RPC Error: ${sendResponse.errorResultXdr || "Check console"}`);
      }

      // 6. Direct RPC Polling
      let txResultStatus = "NOT_FOUND";
      while (true) {
        const response = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: { hash: sendResponse.hash }
          })
        });
        const json = await response.json();
        txResultStatus = json.result?.status || "NOT_FOUND";
        if (txResultStatus === "SUCCESS" || txResultStatus === "FAILED") break;
        await new Promise(r => setTimeout(r, 2000));
      }

      if (txResultStatus === "FAILED") throw new Error("TX Failed.");
      console.log("Order Placed successfully! Hash:", sendResponse.hash);
      setStatus("SUCCESS");
      
      // Dispatch detailed event for log
      window.dispatchEvent(new CustomEvent('stellar:order_placed', { 
        detail: { sellToken: sellTokenName, buyToken: buyTokenName, sellAmount: sellAmount.toString(), buyPrice: buyPrice.toString() } 
      }));
      
      // Global update signal
      window.dispatchEvent(new CustomEvent('stellar:orders_updated'));
    } catch (e: any) {
      handleError(e);
    }
  }, [address, sign]);

  const cancelOrder = useCallback(async (id: number) => {
    if (!address || !CONTRACT_ID) return;
    setStatus("PENDING");
    try {
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, { fee: "20000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
              functionName: xdr.ScVal.scvSymbol("cancel_order").sym(),
              args: [nativeToScVal(id, { type: "u64" })],
            })
          ),
          auth: [],
        }))
        .setTimeout(300)
        .build();
      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await sign(preparedTx.toXDR());
      const sendResponse = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as any);
      
      // Basic polling
      let status = "PENDING";
      while (status !== "SUCCESS" && status !== "FAILED") {
        const res = await server.getTransaction(sendResponse.hash);
        status = res.status;
        await new Promise(r => setTimeout(r, 2000));
      }
      setStatus("SUCCESS");
      window.dispatchEvent(new CustomEvent('stellar:orders_updated'));
    } catch (e) { handleError(e); }
  }, [address, sign]);

  const fillOrder = useCallback(async (id: number) => {
    if (!address || !CONTRACT_ID) return;
    setStatus("PENDING");
    try {
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, { fee: "20000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
              functionName: xdr.ScVal.scvSymbol("fill_order").sym(),
              args: [
                nativeToScVal(Address.fromString(address), { type: "address" }),
                nativeToScVal(id, { type: "u64" })
              ],
            })
          ),
          auth: [],
        }))
        .setTimeout(300)
        .build();
      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await sign(preparedTx.toXDR());
      await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as any);
      setStatus("SUCCESS");
      window.dispatchEvent(new CustomEvent('stellar:orders_updated'));
    } catch (e) { handleError(e); }
  }, [address, sign]);

  function handleError(e: any) {
    console.error("Soroban Error:", e);
    setError(e.message || "Error");
    setStatus("FAILED");
  }

  return { status, error, placeOrder, cancelOrder, fillOrder, fetchOrders };
}

