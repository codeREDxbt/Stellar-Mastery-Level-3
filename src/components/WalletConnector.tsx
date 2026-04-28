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
        className="group relative overflow-hidden px-8 py-2.5 rounded bg-white text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-aurora/0 via-aurora/20 to-aurora/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        <span className="relative z-10 mono-tech text-[10px] font-black uppercase tracking-[0.3em]">
          Initiate_Auth
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-2">
          <span className="mono-tech text-[8px] font-black text-aurora tracking-widest uppercase">Network_Live</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon animate-pulse" />
        </div>
        <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
           <span className="mono-tech text-[9px] text-white/40 font-bold tracking-tighter">
            NODE_ADDR: <span className="text-white/80">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </span>
        </div>
      </div>

      <button
        onClick={onDisconnect}
        className="group relative w-10 h-10 rounded border border-white/5 bg-white/[0.02] flex items-center justify-center transition-all duration-300 hover:bg-danger/10 hover:border-danger/30 hover:shadow-[0_0_15px_rgba(255,71,87,0.1)]"
        title="Terminate Session"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-4 h-4 text-white/30 group-hover:text-danger group-hover:rotate-90 transition-all duration-500"
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        
        {/* Hover Tooltip */}
        <div className="absolute top-full right-0 mt-3 px-3 py-1.5 rounded bg-black border border-white/10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none z-50">
          <span className="mono-tech text-[7px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
            Terminate_Connection
          </span>
        </div>
      </button>
    </div>
  );
}
