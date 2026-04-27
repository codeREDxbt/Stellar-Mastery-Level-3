"use client";

import { useBalances } from "@/hooks/useBalances";

interface BalanceDisplayProps {
  address: string | null;
}

export function BalanceDisplay({ address }: BalanceDisplayProps) {
  const { xlm, usdc, loading } = useBalances(address);

  if (!address) return null;

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 glass-panel p-4 border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="mono-tech text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
            XLM Balance
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black tracking-tighter ${loading ? 'animate-pulse' : ''}`}>
              {xlm}
            </span>
            <span className="text-[10px] font-bold text-white/40 uppercase mono-tech">
              XLM
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-panel p-4 border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-aurora/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="mono-tech text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
            USDC Balance
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black tracking-tighter ${loading ? 'animate-pulse' : ''}`}>
              {usdc}
            </span>
            <span className="text-[10px] font-bold text-white/40 uppercase mono-tech">
              USDC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
