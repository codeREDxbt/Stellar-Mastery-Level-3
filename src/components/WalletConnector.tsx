"use client";

import React from "react";

interface Props {
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnector({ address, onConnect, onDisconnect }: Props) {
  if (!address) {
    return (
      <button
        onClick={onConnect}
        className="aurora-border px-5 py-2 rounded-md bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
      >
        Auth Protocol
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-md px-4 py-2">
      <div className="flex flex-col items-end">
        <span className="mono-tech text-[9px] font-bold text-primary">CONNECTED</span>
        <span className="mono-tech text-[10px] text-white opacity-80">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
      </div>
      <button
        onClick={onDisconnect}
        className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-xs text-danger hover:bg-danger/10 hover:border-danger/30 transition-all"
        title="Disconnect Session"
      >
        ×
      </button>
    </div>
  );
}
