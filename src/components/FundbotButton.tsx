"use client";
import React, { useState } from "react";
import { fundWithFriendbot } from "@/lib/stellar/horizon";
import { toast } from "sonner";

interface Props {
  address: string;
  onFunded: () => void;
}

export function FundbotButton({ address, onFunded }: Props) {
  const [loading, setLoading] = useState(false);

  const handleFund = async () => {
    setLoading(true);
    try {
      await fundWithFriendbot(address);
      toast.success("Account Funded", {
        description: "10,000 XLM has been added to your testnet account.",
      });
      onFunded();
    } catch {
      toast.error("Funding Failed", {
        description: "Friendbot could not fund your account. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-lg px-6 py-4 mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="mono-tech text-[9px] font-black text-warning uppercase tracking-[0.2em]">
          ⚠ Unfunded Account
        </p>
        <p className="mono-tech text-[8px] text-white/30 mt-0.5">
          Fund your testnet account with 10,000 XLM to get started.
        </p>
      </div>
      <button
        onClick={handleFund}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded bg-white text-black font-black mono-tech text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        {loading && (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? "Funding…" : "Fund Account"}
      </button>
    </div>
  );
}
