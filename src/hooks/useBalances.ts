import { Horizon } from "@stellar/stellar-sdk";
import { useState, useEffect, useCallback } from "react";

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

export function useBalances(address: string | null) {
  const [balances, setBalances] = useState<{ xlm: string; usdc: string; rawXlm: string; rawUsdc: string }>({ 
    xlm: "0.00", 
    usdc: "0.00",
    rawXlm: "0.00",
    rawUsdc: "0.00"
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const account = await server.loadAccount(address);
      let xlmRaw = "0.00";
      let usdcRaw = "0.00";

      account.balances.forEach((b: any) => {
        if (b.asset_type === "native") {
          xlmRaw = b.balance;
        } else if (b.asset_code === "USDC") {
          usdcRaw = b.balance;
        }
      });

      setBalances({ 
        xlm: parseFloat(xlmRaw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
        usdc: parseFloat(usdcRaw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        rawXlm: xlmRaw,
        rawUsdc: usdcRaw
      });
    } catch (e) {
      console.error("Balance fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setBalances({ xlm: "0.00", usdc: "0.00", rawXlm: "0.00", rawUsdc: "0.00" });
      return;
    }
    
    refresh();

    // Refresh every 30s as a fallback
    const interval = setInterval(refresh, 30000);

    // Listen for local updates (after successful txs)
    const handleUpdate = () => refresh();
    window.addEventListener('stellar:orders_updated', handleUpdate);
    window.addEventListener('stellar:order_placed', handleUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stellar:orders_updated', handleUpdate);
      window.removeEventListener('stellar:order_placed', handleUpdate);
    };
  }, [address, refresh]);

  return { ...balances, loading, refresh };
}
