"use client";
import React, { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  step: number; // 0=signing, 1=broadcasting, 2=confirming, 3=done
  status: "pending" | "success" | "error";
  txHash: string | null;
  errorMessage: string | null;
  onClose: () => void;
}

const STEPS = [
  { label: "Signing transaction" },
  { label: "Broadcasting to network" },
  { label: "Awaiting confirmation" },
  { label: "Confirmed" },
];

function StepIcon({ done, active, error }: { done: boolean; active: boolean; error: boolean }) {
  if (error) return <span className="w-5 h-5 flex items-center justify-center text-danger text-sm font-black">✕</span>;
  if (done) return <span className="w-5 h-5 flex items-center justify-center text-success text-sm">✓</span>;
  if (active) {
    return (
      <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  return <span className="w-4 h-4 rounded-full border border-white/10" />;
}

export function TxStatusModal({ isOpen, step, status, txHash, errorMessage, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "pending") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const canClose = status !== "pending";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current && canClose) onClose(); }}
    >
      <div className="glass-panel rounded-lg w-full max-w-sm p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Transaction</h2>
          {canClose && (
            <button onClick={onClose} aria-label="Close" className="text-white/20 hover:text-white/60 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="space-y-5 mb-8">
          {STEPS.map((s, i) => {
            const done = status === "success" ? i <= step : (i < step && status !== "error");
            const active = i === step && status === "pending";
            const hasError = status === "error" && i === step;
            const pending = !done && !active && !hasError;
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <StepIcon done={done} active={active} error={hasError} />
                </div>
                <span className={`mono-tech text-[10px] uppercase tracking-widest font-bold transition-colors ${done ? "text-success" : active ? "text-white" : hasError ? "text-danger" : "text-white/20"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Success state */}
        {status === "success" && (
          <div className="border-t border-white/5 pt-6 space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 52 52" className="w-8 h-8 text-success shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="26" cy="26" r="25" className="opacity-10" fill="currentColor" />
                <path d="M14 26l9 9 15-15" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 60, strokeDashoffset: 0, animation: "draw-check 0.4s ease-out forwards" }} />
              </svg>
              <span className="mono-tech text-[10px] font-black text-success uppercase tracking-widest">Confirmed</span>
            </div>
            {txHash && (
              <div className="bg-white/[0.02] border border-white/5 rounded p-3">
                <p className="mono-tech text-[8px] text-white/30 uppercase tracking-widest mb-1">TX Hash</p>
                <p className="mono-tech text-[9px] text-white/60 break-all">
                  {txHash.slice(0, 8)}…{txHash.slice(-8)}
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-tech text-[9px] text-primary hover:text-primary/80 uppercase tracking-widest mt-2 inline-block transition-colors"
                >
                  View on Stellar Expert →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {status === "error" && errorMessage && (
          <div className="border-t border-white/5 pt-6 animate-in fade-in duration-300">
            <p className="mono-tech text-[10px] text-danger uppercase tracking-widest font-bold">&gt; Error</p>
            <p className="mono-tech text-[9px] text-white/40 mt-2 leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
