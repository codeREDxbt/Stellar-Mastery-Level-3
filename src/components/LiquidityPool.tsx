"use client";

import React, { useState, useEffect } from "react";
import { TxStatus } from "@/hooks/useSwap";
import { toast } from "sonner";

interface Props {
  address: string | null;
  reserves: { a: string; b: string };
  onDeposit: (amountA: bigint, amountB: bigint) => Promise<void>;
  onConnect: () => void;
  status: TxStatus;
  fetchReserves: () => void;
  userBalances: { rawXlm: string; rawUsdc: string };
}

export function LiquidityPool({ address, reserves, onDeposit, onConnect, status, fetchReserves, userBalances }: Props) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  useEffect(() => {
    fetchReserves();
    const interval = setInterval(fetchReserves, 10000);
    return () => clearInterval(interval);
  }, [fetchReserves]);

  // Handle status updates with toasts
  useEffect(() => {
    if (status === "SUCCESS") {
      toast.success("Liquidity Added", {
        description: "Pool reserves have been updated successfully.",
      });
      setAmountA("");
      setAmountB("");
    }
  }, [status]);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amountA || !amountB) return;
    
    const aNum = parseFloat(amountA);
    const bNum = parseFloat(amountB);

    // Check Wallet Balances
    if (aNum > parseFloat(userBalances.rawUsdc)) {
      toast.error("Insufficient Balance", { description: "You don't have enough USDC to complete this deposit." });
      return;
    }
    if (bNum > parseFloat(userBalances.rawXlm)) {
      toast.error("Insufficient Balance", { description: "You don't have enough XLM to complete this deposit." });
      return;
    }

    onDeposit(
      BigInt(Math.floor(aNum * 1e7)),
      BigInt(Math.floor(bNum * 1e7))
    );
  };

  const isPending = status === "PENDING";

  return (
    <div className="glass-panel rounded-lg overflow-hidden border border-white/5 bg-white/[0.01]">
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon" />
          <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Liquidity_Pool</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="mono-tech text-[8px] text-primary font-bold tracking-widest uppercase">Active_Vault</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded bg-white/[0.03] border border-white/5">
            <div className="text-[7px] text-white/30 uppercase font-black tracking-[0.2em] mb-2">Pool_Reserve_USDC</div>
            <div className="text-xl font-black tracking-tighter">{reserves.a} <span className="text-[10px] text-white/20 uppercase mono-tech">USDC</span></div>
          </div>
          <div className="p-4 rounded bg-white/[0.03] border border-white/5">
            <div className="text-[7px] text-white/30 uppercase font-black tracking-[0.2em] mb-2">Pool_Reserve_XLM</div>
            <div className="text-xl font-black tracking-tighter">{reserves.b} <span className="text-[10px] text-white/20 uppercase mono-tech">XLM</span></div>
          </div>
        </div>

        {/* Deposit Inputs */}
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mono-tech text-[8px] font-bold text-white/30 uppercase px-1">USDC_Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="w-full bg-white/[0.03] p-4 rounded border border-white/5 text-lg font-black outline-none focus:border-primary/30 transition-all placeholder:text-white/5"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="mono-tech text-[8px] font-bold text-white/30 uppercase px-1">XLM_Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="w-full bg-white/[0.03] p-4 rounded border border-white/5 text-lg font-black outline-none focus:border-primary/30 transition-all placeholder:text-white/5"
                disabled={isPending}
              />
            </div>
          </div>

          <button
            type={address ? "submit" : "button"}
            onClick={address ? undefined : (e) => { e.preventDefault(); onConnect(); }}
            disabled={isPending || (!!address && (!amountA || !amountB))}
            className={`w-full py-4 rounded font-black text-[9px] uppercase tracking-[0.4em] transition-all ${
              isPending 
                ? "bg-white/5 text-white/20 cursor-not-allowed" 
                : "bg-primary text-black hover:scale-[1.01] active:scale-[0.99] shadow-neon"
            }`}
          >
            {isPending ? "Injecting_Liquidity..." : address ? "Seed_Pool_Vault" : "Connect_to_Seed_Pool"}
          </button>
        </form>

        <button 
          onClick={() => toast.info("Pool Ratio Protocol", {
            description: "Adding liquidity establishes the initial price ratio. Ensure the ratio matches current market rate."
          })}
          className="w-full p-4 rounded bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left"
        >
          <p className="text-[8px] mono-tech text-primary/60 leading-relaxed uppercase tracking-widest font-bold">
            &gt; VIEW_POOL_RATIO_WARNING_PROTOCOL
          </p>
        </button>
      </div>
    </div>
  );
}
