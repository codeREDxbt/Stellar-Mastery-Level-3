import { Horizon } from "@stellar/stellar-sdk";
import { useEffect, useState } from "react";

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const horizon = new Horizon.Server(HORIZON_URL);

export function useEvents(publicKey: string | null) {
  const [payments, setPayments] = useState<any[]>([]);
  const [contractEvents, setContractEvents] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Horizon SSE — live payments stream with reconnection logic
  useEffect(() => {
    let closeStream: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    function startStream() {
      if (!publicKey) return;

      setIsLive(true);
      closeStream = horizon
        .payments()
        .forAccount(publicKey)
        .cursor("now")
        .stream({
          onmessage: (payment: any) => {
            setPayments((p) => [payment, ...p].slice(0, 50));
          },
          onerror: (err: any) => {
            // Horizon streams close frequently in dev or on network resets.
            // We just log it quietly and try to reconnect in 5 seconds.
            setIsLive(false);
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(() => {
              console.log("Hooks: Reconnecting to Horizon stream...");
              startStream();
            }, 5000);
          },
        });
    }

    startStream();

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

    window.addEventListener('stellar:order_placed' as any, handleLocalOrder);
    window.addEventListener('stellar:orders_updated' as any, handleLocalOrder);
    
    return () => {
      if (closeStream) closeStream();
      if (retryTimeout) clearTimeout(retryTimeout);
      window.removeEventListener('stellar:order_placed' as any, handleLocalOrder);
      window.removeEventListener('stellar:orders_updated' as any, handleLocalOrder);
    };
  }, [publicKey]);

  return { payments, contractEvents, isLive };
}
