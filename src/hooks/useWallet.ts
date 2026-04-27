import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { useState, useCallback, useEffect } from "react";

let kitInitialized = false;

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initKit = useCallback(() => {
    if (typeof window === "undefined" || kitInitialized) return;
    
    console.log("Hooks: Initializing StellarWalletsKit...");
    try {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: defaultModules(),
      });
      kitInitialized = true;
      console.log("Hooks: StellarWalletsKit initialized successfully.");
    } catch (e) {
      console.error("Hooks: StellarWalletsKit init failed:", e);
      setError("Failed to initialize wallet kit.");
    }
  }, []);

  useEffect(() => {
    initKit();
    const saved = localStorage.getItem("stellar_address");
    if (saved) setAddress(saved);
  }, [initKit]);

  const connect = useCallback(async () => {
    setError(null);
    if (!kitInitialized) initKit();
    try {
      const result = await StellarWalletsKit.authModal();
      if (result && result.address) {
        setAddress(result.address);
        localStorage.setItem("stellar_address", result.address);
      } else {
        setError("No wallet selected or connection failed.");
      }
    } catch (e: any) {
      console.warn("Hooks: authModal error:", e);
      if (e.message?.includes("No modules")) {
        setError("No Stellar wallets found. Please install Freighter or Albedo.");
      } else {
        setError("Wallet connection cancelled or failed.");
      }
    }
  }, [initKit]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
      setAddress(null);
      setError(null);
      localStorage.removeItem("stellar_address");
    } catch (e) {
      console.error("Hooks: Disconnect error:", e);
    }
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("No wallet connected");
      
      // FIX: Don't send mock XDR strings to the real wallet API
      if (xdr.startsWith("mock")) {
        console.log("Hooks: Simulating sign for mock XDR...");
        await new Promise(r => setTimeout(r, 1500)); // Simulate delay
        return `${xdr}-signed`;
      }

      try {
        const response = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: Networks.TESTNET,
          address: address,
        });
        console.log("Hooks: Wallet sign response:", response);
        // Handle both object and string responses
        const signedXdr = (response as any).signedTxXdr || response;
        return signedXdr;
      } catch (e) {
        console.error("Hooks: Sign failed:", e);
        throw e;
      }
    },
    [address]
  );

  return { address, error, connect, disconnect, sign };
}
