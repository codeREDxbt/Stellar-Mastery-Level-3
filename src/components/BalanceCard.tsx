"use client";
import React from "react";
import { formatXLM } from "@/lib/utils/format";
import { Skeleton } from "./Skeleton";

interface Props {
  address: string;
  xlmAmount: string;
  allBalances: any[];
  isLoading: boolean;
  isStale: boolean;
  isRevalidating: boolean;
  error: string | null;
  onRefresh: () => void;
}

function CacheDot({ isStale, isRevalidating }: { isStale: boolean; isRevalidating: boolean }) {
  if (isRevalidating) {
    return (
      <span className="mono-tech text-[8px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
        <svg className="w-2.5 h-2.5 animate-spin text-white/20" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Refreshing…
      </span>
    );
  }
  const dotColor = isStale ? "bg-warning" : "bg-success";
  const label = isStale ? "Stale data" : "Live";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${!isStale ? "animate-pulse" : ""}`} />
      <span className="mono-tech text-[8px] text-white/30 uppercase tracking-widest">{label}</span>
    </span>
  );
}

export function BalanceCard({ address, xlmAmount, allBalances, isLoading, isStale, isRevalidating, error, onRefresh }: Props) {
  const xlmFloat = parseFloat(xlmAmount);
  const isFunded = !error || error !== "account_not_funded";

  const otherAssets = allBalances.filter(b => b.asset_type !== 'native');

  return (
    <div className="glass-panel aurora-border rounded-lg p-8 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <span className="mono-tech text-[9px] font-black tracking-[0.25em] text-white/30 uppercase">Your Balance</span>
        <div className="flex items-center gap-4">
          <CacheDot isStale={isStale} isRevalidating={isRevalidating} />
          <button
            onClick={onRefresh}
            disabled={isLoading || isRevalidating}
            title="Refresh balance"
            aria-label="Refresh balance"
            className="w-7 h-7 flex items-center justify-center rounded border border-white/5 bg-white/[0.02] hover:border-primary/30 hover:text-primary text-white/30 transition-all disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balance number */}
      {isLoading ? (
        <div className="space-y-3 mb-4">
          <Skeleton height="4rem" width="55%" />
          <Skeleton height="1rem" width="30%" />
        </div>
      ) : error === "account_not_funded" ? (
        <div className="mb-4">
          <p className="mono-tech text-[10px] text-warning uppercase tracking-widest font-bold">
            &gt; Account not funded on Testnet
          </p>
          <p className="mono-tech text-[8px] text-white/30 mt-1">Use the Fund Account button below to get test XLM.</p>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-end gap-3">
            <span
              className="text-[4rem] font-black leading-none tracking-tighter text-white"
              style={{ fontFamily: "var(--font-instrument-serif, 'Georgia', serif)" }}
            >
              {formatXLM(xlmAmount)}
            </span>
            <span className="mono-tech text-lg font-black text-white/30 mb-2">XLM</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="mono-tech text-[10px] text-white/30 uppercase tracking-widest">Testnet Network</span>
          </div>
        </div>
      )}

      {/* Token Portfolio for non-XLM assets */}
      {!isLoading && !error && otherAssets.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <h4 className="mono-tech text-[8px] font-black tracking-[0.2em] text-white/20 uppercase mb-4">Token_Portfolio</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherAssets.map((asset, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="mono-tech text-[10px] font-black text-white/80">{asset.asset_code}</span>
                  <span className="mono-tech text-[7px] text-white/20 uppercase tracking-tighter">
                    {asset.asset_issuer ? `${asset.asset_issuer.slice(0, 4)}...${asset.asset_issuer.slice(-4)}` : 'Asset'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="mono-tech text-[11px] font-black text-white/90">{parseFloat(asset.balance).toFixed(2)}</span>
                  <span className="mono-tech text-[7px] text-success/50 uppercase tracking-tighter">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
