import { 
  Horizon, 
  TransactionBuilder, 
  Asset, 
  Operation, 
  Networks, 
  Account
} from "@stellar/stellar-sdk";
import { useState, useCallback } from "react";

export type TxStatus = "IDLE" | "PENDING" | "SUCCESS" | "FAILED";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);



export function useSwap(address: string | null, sign: (xdr: string) => Promise<string>) {
  const [status, setStatus] = useState<TxStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useCallback(async (
    sellToken: string,
    buyToken: string,
    sellAmount: bigint,
    buyPrice: bigint
  ) => {
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    setStatus("PENDING");
    setError(null);

    try {
      // 1. Fetch authentic account data from Testnet
      const accountResponse = await server.loadAccount(address);
      const source = new Account(address, accountResponse.sequenceNumber());

      // 2. Define Assets
      const usdcAsset = new Asset("USDC", "GBBD67IFXCLW6ZSHS66G6SUTI363XN7YAVX5XG3Y5QETLCH3YJ62CHRI");
      const selling = sellToken === "USDC" ? usdcAsset : Asset.native();
      const buying = buyToken === "USDC" ? usdcAsset : Asset.native();

      // 3. Build Authentic Transaction
      const transaction = new TransactionBuilder(source, {
        fee: "1000", // Standard Testnet Fee
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.createPassiveSellOffer({
            selling,
            buying,
            amount: (Number(sellAmount) / 1e7).toString(),
            price: (Number(buyPrice) / 1e7).toString(),
          })
        )
        .setTimeout(180)
        .build();

      const xdr = transaction.toXDR();

      // 4. Request Authentic Signature from Wallet
      console.log("Authentic signing requested...");
      const signedXdr = await sign(xdr);

      // 5. Submit to Stellar Testnet
      console.log("Submitting to network...");
      const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET) as any;
      const result = await server.submitTransaction(transactionToSubmit);
      
      console.log("Transaction Success:", result.hash);
      setStatus("SUCCESS");

      // Broadcast event for UI
      window.dispatchEvent(new CustomEvent('stellar:order_placed', { 
        detail: { sellToken, buyToken, sellAmount, buyPrice, timestamp: Date.now() } 
      }));

    } catch (e: any) {
      handleError(e);
    }
  }, [address, sign]);

  function handleError(e: any) {
    console.error("Authentic Swap Error:", e);
    
    let message = "An unexpected error occurred.";
    
    // Parse Horizon Error Responses
    if (e.response?.data?.extras?.result_codes) {
      const codes = e.response.data.extras.result_codes;
      const opCode = codes.operations ? codes.operations[0] : "";
      
      if (codes.transaction === "tx_insufficient_balance") message = "Insufficient XLM for transaction fees.";
      else if (opCode === "op_underfunded") message = "Insufficient token balance to place this order.";
      else if (opCode === "op_no_trust") message = "No Trustline: You must add this token to your wallet first.";
      else if (opCode === "op_low_reserve") message = "Account reserve too low. Add more XLM.";
      else message = `Network Rejected: ${opCode || codes.transaction}`;
    } else if (e.message?.includes("closed") || e.message?.includes("User rejected")) {
      message = "Transaction cancelled by user.";
    } else {
      message = e.message ?? message;
    }

    setError(message);
    setStatus("FAILED");
  }

  return { status, error, placeOrder };
}
