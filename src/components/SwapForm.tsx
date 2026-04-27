"use client";

import React, { useState } from "react";
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
}

export function SwapForm({ onPlaceOrder, status, error }: Props) {
  const [sellAmount, setSellAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellToken, setSellToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("XLM");

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
      {/* Header aligned with Activity Log */}
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
                onChange={(e) => setSellToken(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option>USDC</option>
                <option>XLM</option>
              </select>
            </div>
          </div>

          {/* Pivot */}
          <div className="flex justify-center -my-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary shadow-neon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 10l5 5 5-5"/></svg>
            </div>
          </div>

          {/* Buy Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="mono-tech text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Target Rate</label>
              <span className="mono-tech text-[9px] text-primary font-black">MARKET_SYNC</span>
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
                onChange={(e) => setBuyToken(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option>XLM</option>
                <option>USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-auto">
          {/* Notifications area */}
          <div className="min-h-[30px]">
            {error && (
              <div className="text-[10px] mono-tech font-bold text-danger uppercase tracking-tight animate-in fade-in">
                &gt; ERROR: {error}
              </div>
            )}
            {status === "SUCCESS" && !error && (
              <div className="text-[10px] mono-tech font-bold text-primary uppercase tracking-tight animate-in fade-in">
                &gt; BROADCAST_SUCCESS: LEDGER_CONFIRMED
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

          {/* Technical Data */}
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
