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
  Contract
} from "@stellar/stellar-sdk";
import { useState, useCallback } from "react";

export type TxStatus = "IDLE" | "PENDING" | "SUCCESS" | "FAILED";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

const TOKEN_CONTRACTS: Record<string, string> = {
  USDC: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
};

export function useSwap(address: string | null, sign: (xdr: string) => Promise<string>) {
  const [status, setStatus] = useState<TxStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [reserves, setReserves] = useState<{ a: string; b: string }>({ a: "0", b: "0" });

  const fetchReserves = useCallback(async () => {
    if (!CONTRACT_ID) return;
    try {
      const tx = new TransactionBuilder(
        new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
        { fee: "100", networkPassphrase: Networks.TESTNET }
      )
        .addOperation(Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
              functionName: xdr.ScVal.scvSymbol("get_reserves").sym(),
              args: [],
            })
          ),
          auth: [],
        }))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx as any) as any;
      const result = sim.result || sim.results?.[0];
      if (result && result.retval) {
        const val = scValToNative(result.retval);
        setReserves({ 
          a: (Number(val[0]) / 1e7).toFixed(2), 
          b: (Number(val[1]) / 1e7).toFixed(2) 
        });
      }
    } catch (e) {
      console.error("Fetch reserves error:", e);
    }
  }, []);

  const deposit = useCallback(async (amountA: bigint, amountB: bigint) => {
    if (!address || !CONTRACT_ID) return;
    setStatus("PENDING");
    setError(null);
    try {
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, { fee: "20000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
              functionName: xdr.ScVal.scvSymbol("deposit").sym(),
              args: [
                nativeToScVal(Address.fromString(address), { type: "address" }),
                nativeToScVal(Address.fromString(TOKEN_CONTRACTS.USDC), { type: "address" }),
                nativeToScVal(Address.fromString(TOKEN_CONTRACTS.XLM), { type: "address" }),
                nativeToScVal(amountA, { type: "i128" }),
                nativeToScVal(amountB, { type: "i128" }),
              ],
            })
          ),
          auth: [],
        }))
        .setTimeout(300)
        .build();

      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await sign(preparedTx.toXDR());
      const sendResponse = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as any) as any;
      
      if (sendResponse.status === "ERROR") throw new Error(sendResponse.errorResultXdr);

      setLastTxHash(sendResponse.hash);
      setStatus("SUCCESS");
      fetchReserves();
      window.dispatchEvent(new CustomEvent('stellar:orders_updated', {
        detail: { 
          amountA: amountA.toString(), 
          amountB: amountB.toString(),
          type: 'POOL_DEPOSIT'
        }
      }));
    } catch (e: any) {
      console.error(e);
      let msg = "Deposit failed";
      const errorStr = e.toString();
      
      if (errorStr.includes("insufficient balance")) {
        msg = "Insufficient wallet balance to deposit";
      } else if (errorStr.includes("User denied")) {
        msg = "Transaction signing cancelled";
      }
      
      setError(msg);
      setStatus("FAILED");
    }
  }, [address, sign, fetchReserves]);

  const instantSwap = useCallback(async (sellToken: string, amount: bigint) => {
    if (!address || !CONTRACT_ID) return;
    setStatus("PENDING");
    setError(null);
    try {
      const tokenIn = TOKEN_CONTRACTS[sellToken];
      const account = await server.getAccount(address);
      const tx = new TransactionBuilder(account, { fee: "20000", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(CONTRACT_ID)),
              functionName: xdr.ScVal.scvSymbol("swap").sym(),
              args: [
                nativeToScVal(Address.fromString(address), { type: "address" }),
                nativeToScVal(Address.fromString(tokenIn), { type: "address" }),
                nativeToScVal(amount, { type: "i128" }),
              ],
            })
          ),
          auth: [],
        }))
        .setTimeout(300)
        .build();

      const preparedTx = await server.prepareTransaction(tx);
      const signedXdr = await sign(preparedTx.toXDR());
      const sendResponse = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as any) as any;
      
      if (sendResponse.status === "ERROR") throw new Error(sendResponse.errorResultXdr);

      setLastTxHash(sendResponse.hash);
      setStatus("SUCCESS");
      fetchReserves();
      window.dispatchEvent(new CustomEvent('stellar:orders_updated', {
        detail: { 
          amount: amount.toString(),
          sellToken: sellToken,
          type: 'INSTANT_SWAP'
        }
      }));
    } catch (e: any) {
      console.error(e);
      let msg = "Swap failed";
      const errorStr = e.toString();
      
      if (errorStr.includes("insufficient balance") || errorStr.includes("Error(HasFailed)")) {
        msg = "Insufficient wallet balance for this operation";
      } else if (errorStr.includes("insufficient liquidity") || errorStr.includes("HostError")) {
        msg = "Pool liquidity too low for this amount";
      } else if (errorStr.includes("User denied")) {
        msg = "Transaction signing cancelled";
      }
      
      setError(msg);
      setStatus("FAILED");
    }
  }, [address, sign, fetchReserves]);

  return { status, error, lastTxHash, reserves, deposit, instantSwap, fetchReserves };
}
