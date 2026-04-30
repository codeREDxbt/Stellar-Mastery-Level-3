"use client";
import React, { useEffect, useState } from "react";
import { fetchRecentPayments } from "@/lib/stellar/horizon";
import { shortenKey, formatRelativeDate } from "@/lib/utils/format";
import { Skeleton } from "./Skeleton";

interface Props {
  address: string;
}

export function TxHistory({ address }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    fetchRecentPayments(address, 10)
      .then(setPayments)
      .catch(() => setError("Could not load payment history."))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="glass-panel rounded-lg flex flex-col shadow-2xl max-w-lg mx-auto w-full">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Tx_History</h3>
        </div>
        <span className="mono-tech text-[9px] text-white/30 uppercase">Last 10 Payments</span>
      </div>

      <div className="p-6">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="48px" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="mono-tech text-[9px] text-danger uppercase tracking-widest font-bold text-center py-8">&gt; {error}</p>
        )}

        {!loading && !error && payments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h12M6 12h8" strokeLinecap="round" />
            </svg>
            <p className="mono-tech text-[10px] text-white/30 uppercase tracking-widest font-black">No Payments Yet</p>
            <p className="mono-tech text-[8px] text-white/20 uppercase tracking-widest text-center">
              Send or receive XLM to see your history here.
            </p>
          </div>
        )}

        {!loading && !error && payments.length > 0 && (
          <div className="divide-y divide-white/[0.04]">
            {payments.map((p: any, i: number) => {
              const opType: string = p.type ?? '';
              let isOutgoing: boolean;
              let counterparty: string;
              let amount: string;

              if (opType === 'create_account') {
                isOutgoing = p.funder === address;
                counterparty = isOutgoing ? (p.account ?? '') : (p.funder ?? '');
                amount = parseFloat(p.starting_balance ?? '0').toFixed(2);
              } else {
                isOutgoing = p.from === address;
                counterparty = isOutgoing ? (p.to ?? '') : (p.from ?? '');
                amount = parseFloat(p.amount ?? p.source_amount ?? '0').toFixed(2);
              }

              const created = p.created_at;
              const txHash = p.transaction_hash;
              
              return (
                <a 
                  key={p.id ?? i} 
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 py-3.5 hover:bg-white/[0.03] transition-all rounded px-2 group cursor-pointer"
                >
                  {/* Direction arrow */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded border shrink-0 transition-colors ${isOutgoing ? "border-white/5 text-white/30 group-hover:border-white/20" : "border-success/20 text-success bg-success/5 group-hover:border-success/40"}`}>
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {isOutgoing
                        ? <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                  </div>

                  {/* Address */}
                  <div className="flex-1 min-w-0">
                    <p className="mono-tech text-[9px] text-white/50 truncate group-hover:text-white/80 transition-colors">{shortenKey(counterparty)}</p>
                  </div>

                  {/* Amount */}
                  <span className={`mono-tech text-[11px] font-black shrink-0 ${isOutgoing ? "text-white/40" : "text-success"}`}>
                    {isOutgoing ? "−" : "+"}{amount} XLM
                  </span>

                  {/* Date & Explorer Link */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="mono-tech text-[8px] text-white/20 hidden sm:block group-hover:text-white/40 transition-colors">
                      {created ? formatRelativeDate(created) : ""}
                    </span>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/10 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
