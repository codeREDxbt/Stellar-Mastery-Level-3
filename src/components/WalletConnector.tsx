"use client";
import React from "react";
import { WalletState } from "@/hooks/useWallet";
import { shortenKey } from "@/lib/utils/format";

interface Props {
  walletState: WalletState;
  address: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnector({ walletState, address, error, onConnect, onDisconnect }: Props) {
  if (walletState === "connected" && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="mono-tech text-[8px] font-black text-success tracking-widest uppercase">Connected</span>
          </div>
          <span className="mono-tech text-[9px] text-white/50 font-bold tracking-tighter">
            {shortenKey(address)}
          </span>
        </div>
        <button
          onClick={onDisconnect}
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          className="group w-9 h-9 rounded border border-white/5 bg-white/[0.02] flex items-center justify-center transition-all duration-300 hover:bg-danger/10 hover:border-danger/30"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/30 group-hover:text-danger transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  if (walletState === "connecting") {
    return (
      <button disabled className="flex items-center gap-2.5 px-5 py-2 rounded border border-white/10 bg-white/[0.03] cursor-not-allowed opacity-70">
        <svg className="w-3.5 h-3.5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="mono-tech text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Connecting…</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={onConnect}
        className="group relative overflow-hidden px-6 py-2.5 rounded bg-white text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
        aria-live="polite"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        <span className="relative z-10 mono-tech text-[10px] font-black uppercase tracking-[0.3em]">Connect Wallet</span>
      </button>
      {walletState === "error" && error && (
        <p role="alert" className="mono-tech text-[8px] text-danger uppercase tracking-wide font-bold">
          {error} —{" "}
          <a href="https://www.freighter.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-danger/80">
            Get Freighter →
          </a>
        </p>
      )}
    </div>
  );
}
