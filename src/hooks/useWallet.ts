import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { SwkAppDarkTheme } from "@creit.tech/stellar-wallets-kit/types";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { useState, useCallback, useEffect, useRef } from "react";

export type WalletState = 'idle' | 'connecting' | 'connected' | 'error';
import { WalletConnectModule } from "@creit.tech/stellar-wallets-kit/modules/wallet-connect";

let kitInitialized = false;

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>('idle');

  const initKit = useCallback(() => {
    if (typeof window === "undefined" || kitInitialized) return;
    
    console.log("Hooks: Initializing StellarWalletsKit...");
    try {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: [
          ...defaultModules(),
          // Only add WalletConnect if a Project ID is actually provided to avoid AppKit errors
          ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? [
            new WalletConnectModule({
              projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
              metadata: {
                name: "Stellar Pulse",
                description: "Premium Stellar Swap Terminal",
                url: typeof window !== "undefined" ? window.location.origin : "https://stellar-pulse.app",
                icons: ["https://stellar-pulse.app/favicon.ico"],
              },
            })
          ] : []),
        ],
        theme: {
          ...SwkAppDarkTheme,
          "background": "#080C0A",
          "background-secondary": "#0F1510",
          "primary": "#10B981",
          "foreground": "#ECFDF5",
          "foreground-secondary": "rgba(236, 253, 245, 0.5)",
          "border": "rgba(16, 185, 129, 0.2)",
          "border-radius": "4px",
          "font-family": "'JetBrains Mono', 'Inter', system-ui",
          "shadow": "0 0 30px rgba(16, 185, 129, 0.12), 0 0 100px rgba(0, 0, 0, 0.9)",
        },
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
    if (saved) {
      setAddress(saved);
      setWalletState('connected');
    }
  }, [initKit]);

  const connect = useCallback(async () => {
    setError(null);
    setWalletState('connecting');
    if (!kitInitialized) initKit();
    try {
      const result = await StellarWalletsKit.authModal();
      if (result && result.address) {
        setAddress(result.address);
        setWalletState('connected');
        localStorage.setItem("stellar_address", result.address);
      } else {
        setError("No wallet selected or connection failed.");
        setWalletState('error');
      }
    } catch (e: any) {
      console.warn("Hooks: authModal error:", e);
      const msg = e.message?.includes("No modules")
        ? "No Stellar wallets found. Install Freighter to continue."
        : "Wallet connection cancelled or failed.";
      setError(msg);
      setWalletState('error');
    }
  }, [initKit]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
      setAddress(null);
      setError(null);
      setWalletState('idle');
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

  return { address, error, walletState, connect, disconnect, sign };
}
