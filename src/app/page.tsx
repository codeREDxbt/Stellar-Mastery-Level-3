"use client";

import { useWallet } from "@/hooks/useWallet";
import { useSwap } from "@/hooks/useSwap";
import { useEvents } from "@/hooks/useEvents";
import { useBalance } from "@/hooks/useBalance";
import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletConnector } from "@/components/WalletConnector";
import { BalanceCard } from "@/components/BalanceCard";
import { FundbotButton } from "@/components/FundbotButton";
import { SendForm } from "@/components/SendForm";
import { TxHistory } from "@/components/TxHistory";
import { SwapForm } from "@/components/SwapForm";
import { EventFeed } from "@/components/EventFeed";
import { LiquidityPool } from "@/components/LiquidityPool";

type Tab = "swap" | "send" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "swap", label: "Swap_Terminal" },
  { id: "send", label: "Send_Payment" },
  { id: "history", label: "Tx_History" },
];

export default function Home() {
  const { address, error: walletError, walletState, connect, disconnect, sign } = useWallet();
  const { 
    xlmAmount, 
    allBalances,
    isLoading: isBalanceLoading, 
    isStale: isBalanceStale, 
    isRevalidating: isBalanceRevalidating, 
    error: balanceError, 
    refresh: refreshBalance 
  } = useBalance(address);
  const { status, error: swapError, lastTxHash, reserves, deposit, instantSwap, fetchReserves } = useSwap(address, sign);
  const { payments, contractEvents, isLive } = useEvents(address);

  const [activeTab, setActiveTab] = useState<Tab>("swap");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate particles only on client to avoid hydration mismatch
    const p = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100 + 100}%`,
      duration: `${Math.random() * 6 + 8}s`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.5
    }));
    setParticles(p);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isFunded = balanceError !== "account_not_funded" && parseFloat(xlmAmount) >= 1;

  // Balances for SwapForm (still use useSwap-level balances from existing hooks)
  const rawXlm = xlmAmount;

  return (
    <main className="min-h-screen text-white overflow-x-hidden flex flex-col relative">

      {/* Premium Effects Layers */}
      <div className="noise-overlay" />
      <div className="vignette" />
      <div className="scanline" />

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animation: `float-particle ${p.duration} linear infinite`,
            animationDelay: p.delay,
            opacity: p.opacity
          }}
        />
      ))}


      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(52, 211, 153, 0.08), transparent 45%)`
        }}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-50 px-6 h-16 border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-black text-black text-[10px] shrink-0">
              S
            </div>
            <Link href="/" className="mono-tech text-[10px] font-black tracking-[0.3em] uppercase opacity-40 hover:opacity-80 transition-opacity">
              Stellar<span className="text-white opacity-100">Pulse</span>
            </Link>
          </div>
          <WalletConnector
            walletState={walletState}
            address={address}
            error={walletError}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </nav>

      {/* Disconnected — full-page hero */}
      {!address && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">

          {/* Subtle grid overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-10 animate-in fade-in duration-700">

            {/* Status badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded border border-white/10 bg-white/[0.03] mono-tech text-[9px] text-primary tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-neon" />
              Stellar Testnet · System Online
            </div>

            {/* Hero heading */}
            <div className="space-y-2">
              <h1 className="text-[clamp(4rem,12vw,9rem)] font-black tracking-tighter leading-[0.85] uppercase italic text-white">
                Stellar
              </h1>
              <h1 className="text-[clamp(4rem,12vw,9rem)] font-black tracking-tighter leading-[0.85] uppercase italic text-aurora">
                Pulse
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-white/30 text-lg max-w-md mx-auto leading-snug tracking-tight">
              Send XLM. Swap tokens.<br />
              All on Stellar Testnet.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={connect}
                className="px-10 py-4 rounded bg-white text-black font-black mono-tech text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.08)]"
              >
                Connect Wallet
              </button>
              <a
                href="https://www.freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 rounded border border-white/10 bg-white/[0.02] text-white/40 font-black mono-tech text-[10px] uppercase tracking-[0.4em] hover:border-white/20 hover:text-white/70 transition-all text-center"
              >
                Get Freighter ↗
              </a>
            </div>

            {walletError && (
              <p role="alert" className="mono-tech text-[9px] text-danger uppercase tracking-widest font-bold animate-in fade-in">
                &gt; {walletError}
              </p>
            )}
          </div>
        </div>

      )}

      {/* Connected dashboard */}
      {address && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

          {/* Balance hero — always visible when connected */}
            <BalanceCard
              address={address}
              xlmAmount={xlmAmount}
              allBalances={allBalances}
              isLoading={isBalanceLoading}
              isStale={isBalanceStale}
              isRevalidating={isBalanceRevalidating}
              error={balanceError}
              onRefresh={refreshBalance}
            />

          {/* Friendbot button — only when unfunded */}
          {(!isFunded || balanceError === "account_not_funded") && (
            <FundbotButton address={address} onFunded={refreshBalance} />
          )}

          {/* Tab switcher */}
          <div className="flex gap-0 border-b border-white/5 mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mono-tech text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 transition-all relative ${activeTab === tab.id
                    ? "text-white"
                    : "text-white/20 hover:text-white/50"
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Swap Tab */}
          {activeTab === "swap" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Status badge */}
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded bg-white/5 border border-white/10 mono-tech text-[9px] text-primary tracking-widest">
                <span className={`w-1.5 h-1.5 rounded-full bg-primary ${isLive ? "animate-pulse shadow-neon" : "opacity-30"}`} />
                {isLive ? "LIVE_FEED: ACTIVE" : "FEED: CONNECTING"}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <SwapForm
                  address={address}
                  onPlaceOrder={instantSwap}
                  onConnect={connect}
                  status={status}
                  error={swapError}
                  lastTxHash={lastTxHash}
                  reserves={reserves}
                  userBalances={{ 
                    rawXlm, 
                    rawUsdc: allBalances.find(b => b.asset_code === 'USDC')?.balance ?? "0.00" 
                  }}
                />
                <EventFeed payments={payments} contractEvents={contractEvents} isLive={isLive} publicKey={address} />
              </div>

              <div className="max-w-2xl mx-auto w-full">
                <LiquidityPool
                  address={address}
                  reserves={reserves}
                  onDeposit={deposit}
                  onConnect={connect}
                  status={status}
                  fetchReserves={fetchReserves}
                  userBalances={{ 
                    rawXlm, 
                    rawUsdc: allBalances.find(b => b.asset_code === 'USDC')?.balance ?? "0.00" 
                  }}
                />
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === "send" && (
            <div className="animate-in fade-in duration-300">
              <SendForm
                address={address}
                xlmBalance={xlmAmount}
                sign={sign}
                onSuccess={refreshBalance}
              />
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="animate-in fade-in duration-300">
              <TxHistory address={address} />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 bg-black/20 shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="mono-tech text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase">
            Stellar Mastery Level 3 · Testnet
          </div>
          <div className="mono-tech text-[10px] font-black tracking-[0.1em] text-white/50">
            MADE BY <span className="text-aurora">VINAYAK</span> (codeREDxbt)
          </div>
        </div>
      </footer>

      {/* Subtle background mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(16,185,129,0.015) 1px, rgba(16,185,129,0.015) 2px)" }}
      />
      
      </div> {/* End Main Content Layer */}
    </main>
  );
}
