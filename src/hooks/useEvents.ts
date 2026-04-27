import { Horizon } from "@stellar/stellar-sdk";
import { useEffect, useState } from "react";

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const horizon = new Horizon.Server(HORIZON_URL);

export function useEvents(publicKey: string | null) {
  const [payments, setPayments] = useState<any[]>([]);
  const [contractEvents, setContractEvents] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Horizon SSE — live payments stream
  useEffect(() => {
    if (!publicKey) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const stream = horizon
      .payments()
      .forAccount(publicKey)
      .cursor("now")
      .stream({
        onmessage: (payment: any) => {
          setPayments((p) => [payment, ...p].slice(0, 50));
        },
        onerror: (err: any) => {
          console.error("Horizon stream error:", err);
          setIsLive(false);
        },
      });

    // Listen for local simulated contract events
    const handleLocalOrder = (e: any) => {
      const event = {
        id: `local-${Date.now()}`,
        type: e.type.replace('stellar:', '').replace('_', ' ').toUpperCase(),
        detail: e.detail,
        timestamp: new Date().toLocaleTimeString(),
      };
      setContractEvents((prev) => [event, ...prev].slice(0, 50));
    };

    window.addEventListener('stellar:order_placed', handleLocalOrder);
    window.addEventListener('stellar:order_filled', handleLocalOrder);

    return () => {
      // @ts-ignore
      if (typeof stream === 'function') stream();
      window.removeEventListener('stellar:order_placed', handleLocalOrder);
      window.removeEventListener('stellar:order_filled', handleLocalOrder);
    };
  }, [publicKey]);

  return { payments, contractEvents, isLive };
}
