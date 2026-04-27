"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TxStatus } from "@/hooks/useSwap";

interface Props {
  onPlaceOrder: (
    sellToken: string,
    buyToken: string,
    sellAmount: bigint,
    buyPrice: bigint
  ) => Promise<void>;
  status: TxStatus;
  error: string | null;
  lastTxHash: string | null;
}

const ASSETS: Record<string, { code: string; issuer?: string }> = {
  USDC: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  XLM: { code: "XLM" },
};

export function SwapForm({ onPlaceOrder, status, error, lastTxHash }: Props) {
  const [sellAmount, setSellAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellToken, setSellToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("XLM");
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const fetchMarketPrice = useCallback(async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;

    setIsFetchingPrice(true);
    try {
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
      const sourceAsset = ASSETS[sellToken];
      const destAsset = ASSETS[buyToken];

      const params = new URLSearchParams({
        source_asset_type: sourceAsset.code === "XLM" ? "native" : "credit_alphanum4",
        source_asset_code: sourceAsset.code === "XLM" ? "" : sourceAsset.code,
        source_asset_issuer: sourceAsset.issuer || "",
        source_amount: sellAmount,
        destination_assets: destAsset.code === "XLM" ? "native" : `${destAsset.code}:${destAsset.issuer}`,
      });

      const response = await fetch(`${horizonUrl}/paths/strict-send?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data._embedded?.records?.[0]) {
          const destinationAmount = data._embedded.records[0].destination_amount;
          // Set the target price (total amount user gets)
          setBuyPrice(destinationAmount);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch market price:", e);
    } finally {
      setIsFetchingPrice(false);
    }
  }, [sellAmount, sellToken, buyToken]);

  // Handle Opposite Tokens
  const handleSellTokenChange = (token: string) => {
    setSellToken(token);
    setBuyToken(token === "USDC" ? "XLM" : "USDC");
  };

  const handleBuyTokenChange = (token: string) => {
    setBuyToken(token);
    setSellToken(token === "USDC" ? "XLM" : "USDC");
  };

  // Auto-fetch price when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarketPrice();
    }, 600); // Debounce
    return () => clearTimeout(timer);
  }, [sellAmount, sellToken, buyToken, fetchMarketPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellAmount || !buyPrice) return;
    const amount = BigInt(Math.floor(parseFloat(sellAmount) * 1e7));
    const price = BigInt(Math.floor(parseFloat(buyPrice) * 1e7));
    onPlaceOrder(sellToken, buyToken, amount, price);
  };

  const isPending = status === "PENDING";

  return (
    <div className="glass-panel rounded-lg flex flex-col shadow-2xl h-[600px]">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon" />
          <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Execution Terminal</h3>
        </div>
        <div className="mono-tech text-[9px] text-white/30 uppercase">Node_Stable</div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Sell Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="mono-tech text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Liquefy Asset</label>
              <span className="mono-tech text-[9px] text-text-muted opacity-30">Available: 1,420.50</span>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded border border-white/5 focus-within:border-primary/30 transition-all">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="bg-transparent text-3xl font-black text-white outline-none w-full placeholder:text-white/5 tracking-tighter"
                disabled={isPending}
              />
              <select 
                value={sellToken}
                onChange={(e) => handleSellTokenChange(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary shadow-neon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 10l5 5 5-5"/></svg>
            </div>
          </div>

          {/* Buy Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="mono-tech text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Target Rate</label>
              <span className={`mono-tech text-[9px] ${isFetchingPrice ? "text-primary animate-pulse" : "text-primary font-black"}`}>
                {isFetchingPrice ? "SYNCING_POOL..." : "MARKET_SYNC"}
              </span>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded border border-white/5 focus-within:border-secondary/30 transition-all">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="bg-transparent text-3xl font-black text-white outline-none w-full placeholder:text-white/5 tracking-tighter"
                disabled={isPending}
              />
              <select 
                value={buyToken}
                onChange={(e) => handleBuyTokenChange(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-auto">
          <div className="min-h-[30px]">
            {error && (
              <div className="text-[10px] mono-tech font-bold text-danger uppercase tracking-tight animate-in fade-in">
                &gt; ERROR: {error}
              </div>
            )}
            {status === "SUCCESS" && !error && (
              <div className="space-y-2 animate-in fade-in">
                <div className="text-[10px] mono-tech font-bold text-primary uppercase tracking-tight">
                  &gt; BROADCAST_SUCCESS: LEDGER_CONFIRMED
                </div>
                {lastTxHash && (
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[9px] mono-tech text-primary/60 hover:text-primary underline decoration-primary/20 transition-colors uppercase tracking-widest"
                  >
                    VIEW_ON_EXPLORER [HASH: {lastTxHash.slice(0, 8)}...]
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || !sellAmount || !buyPrice}
            className={`w-full py-5 rounded font-black text-[10px] uppercase tracking-[0.5em] transition-all relative overflow-hidden ${
              isPending 
                ? "bg-white/5 text-text-muted cursor-not-allowed" 
                : "bg-white text-black hover:bg-primary hover:shadow-neon active:scale-[0.98]"
            }`}
          >
            {isPending ? "Validating_XDR..." : "Execute_Swap"}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] p-4 rounded border border-white/5">
              <span className="text-[7px] text-text-muted uppercase font-black tracking-widest block mb-1">Network Fee</span>
              <span className="mono-tech text-[10px]">0.00001 <span className="opacity-30">XLM</span></span>
            </div>
            <div className="bg-white/[0.02] p-4 rounded border border-white/5">
              <span className="text-[7px] text-text-muted uppercase font-black tracking-widest block mb-1">Impact</span>
              <span className="mono-tech text-[10px] text-primary">&lt; 0.01%</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

