"use client";

import React from "react";

interface Props {
  payments: any[];
  contractEvents: any[];
  isLive?: boolean;
  publicKey?: string | null;
}

export function EventFeed({ payments, contractEvents, isLive, publicKey }: Props) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden border border-white/5 flex flex-col h-[600px] shadow-2xl">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon animate-pulse" />
           <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase">Protocol Activity Log</h3>
        </div>
        {isLive && (
          <span className="mono-tech text-[9px] font-bold text-primary px-2 py-0.5 rounded border border-primary/30 bg-primary/5 uppercase">Realtime</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {contractEvents.length === 0 && payments.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
            <div className="w-10 h-10 border border-dashed border-white/40 rounded flex items-center justify-center mb-4">
              <div className="w-4 h-4 border border-white/40 animate-spin" />
            </div>
            <p className="mono-tech text-[10px] uppercase tracking-widest">Listening for Network Events...</p>
          </div>
        )}

        {/* Contract Events */}
        {contractEvents.map((event) => (
          <div key={event.id} className="group relative">
            <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-primary opacity-50" />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="mono-tech text-[9px] font-black text-primary uppercase">[{event.type}]</span>
                <span className="mono-tech text-[9px] text-text-muted opacity-50">{event.timestamp}</span>
              </div>
              <div className="mono-tech text-xs text-white/90 leading-relaxed bg-white/[0.03] p-4 rounded border border-white/5 group-hover:border-primary/20 transition-all">
                {event.type === 'ORDERS UPDATED' ? (
                  <div className="space-y-1">
                    {event.detail && event.detail.sellToken && event.detail.sellToken !== "UNKNOWN" ? (
                      <>
                        <div>COMMAND: <span className="text-primary">INSTANT_SWAP</span></div>
                        <div className="opacity-60 text-[10px]">
                          TOKEN: {event.detail.sellToken} <br />
                          AMOUNT: {event.detail.amount ? (Number(event.detail.amount) / 1e7).toLocaleString() : '0'}
                        </div>
                      </>
                    ) : event.detail && event.detail.amountA ? (
                      <>
                        <div>COMMAND: <span className="text-aurora">POOL_DEPOSIT</span></div>
                        <div className="opacity-60 text-[10px]">
                          AMOUNT_A: {event.detail.amountA ? (Number(event.detail.amountA) / 1e7).toLocaleString() : '0'} <br />
                          AMOUNT_B: {event.detail.amountB ? (Number(event.detail.amountB) / 1e7).toLocaleString() : '0'}
                        </div>
                      </>
                    ) : (
                      <div>COMMAND: <span className="text-primary">VAULT_SYNC</span></div>
                    )}
                  </div>
                ) : (
                  <div>CMD: <span className="text-primary">PROTOCOL_EVENT</span></div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Payments */}
        {payments.filter(p => Number(p.amount) > 0).map((payment) => {
          const isInbound = payment.to === publicKey;
          return (
            <div key={payment.id} className="group relative">
              <div className={`absolute -left-2 top-0 bottom-0 w-0.5 ${isInbound ? 'bg-secondary' : 'bg-danger'} opacity-50`} />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`mono-tech text-[9px] font-black ${isInbound ? 'text-secondary' : 'text-danger'} uppercase`}>
                    [{isInbound ? 'PAYMENT_INBOUND' : 'PAYMENT_OUTBOUND'}]
                  </span>
                  <span className="mono-tech text-[9px] text-text-muted opacity-50">{new Date(payment.created_at).toLocaleTimeString()}</span>
                </div>
                <div className={`mono-tech text-xs text-white/90 leading-relaxed bg-white/[0.03] p-4 rounded border border-white/5 ${isInbound ? 'group-hover:border-secondary/20' : 'group-hover:border-danger/20'} transition-all`}>
                  <div className="flex justify-between items-center">
                    <span>TRANSFER</span>
                    <span className={isInbound ? 'text-secondary' : 'text-danger'}>
                      {isInbound ? '+' : '-'}{payment.amount || '0'} {payment.asset_code || "XLM"}
                    </span>
                  </div>
                  <div className="mt-1 opacity-50 text-[9px] truncate">
                    {isInbound ? `FROM: ${payment.from || payment.funder || 'SYSTEM'}` : `TO: ${payment.to || payment.account || payment.destination || 'CONTRACT'}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
