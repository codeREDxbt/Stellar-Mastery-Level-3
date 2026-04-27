"use client";

import { useWallet } from "@/hooks/useWallet";
import { useSwap } from "@/hooks/useSwap";
import { useEvents } from "@/hooks/useEvents";
import Link from "next/link";
import { WalletConnector } from "@/components/WalletConnector";
import { SwapForm } from "@/components/SwapForm";
import { EventFeed } from "@/components/EventFeed";
import OrderList from "@/components/OrderList";
import { BalanceDisplay } from "@/components/BalanceDisplay";

export default function Home() {
  const { address, error: walletError, connect, disconnect, sign } = useWallet();
  const { status, error, placeOrder } = useSwap(address, sign);
  const { payments, contractEvents, isLive } = useEvents(address);

  return (
    <main className="min-h-screen text-white overflow-x-hidden flex flex-col">
      {/* Precision Navigation */}
      <nav className="glass-panel sticky top-0 z-50 px-8 h-16 border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-black text-black text-[10px]">
              S
            </div>
            <Link href="/docs" className="mono-tech text-[10px] font-bold tracking-[0.3em] uppercase opacity-40 hover:opacity-80 transition-opacity">
              Stellar.Swap <span className="text-white opacity-100">v2.1</span>
            </Link>
          </div>
          <WalletConnector address={address} onConnect={connect} onDisconnect={disconnect} />
        </div>
      </nav>

      <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-8 py-12 lg:py-20">
        {!address ? (
          <div className="max-w-4xl mx-auto text-center space-y-16 animate-in fade-in duration-1000">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded bg-white/5 border border-white/10 mono-tech text-[9px] text-primary tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-neon" />
              SYSTEM_STATUS: ONLINE
            </div>

            <h2 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase italic">
              Stellar <br />
              <span className="text-aurora">LIQUIDITY</span>
            </h2>

            <p className="text-xl lg:text-2xl text-white/40 max-w-2xl mx-auto font-medium leading-tight tracking-tight">
              Institutional-grade swap infrastructure. <br />
              Zero slippage targets. Pure execution.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={connect}
                  className="aurora-border px-12 py-4 rounded bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl"
                >
                  Connect Wallet
                </button>
                <Link href="/docs" className="px-12 py-4 rounded bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center">
                  Documentation
                </Link>
              </div>

              {walletError && (
                <div className="text-[10px] mono-tech font-bold text-danger uppercase tracking-widest animate-in slide-in-from-top-2 duration-500">
                  &gt; CONNECTION_FAILURE: {walletError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Swap Terminal Column */}
            <div className="space-y-8">
              <BalanceDisplay address={address} />
              <SwapForm onPlaceOrder={placeOrder} status={status} error={error} />
              <OrderList address={address} sign={sign} />
            </div>

            {/* Activity Log Column */}
            <div className="h-full">
              <EventFeed payments={payments} contractEvents={contractEvents} isLive={isLive} publicKey={address} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Credits */}
      <footer className="py-8 border-t border-white/5 bg-black/20 shrink-0">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="mono-tech text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">
            Built for Stellar Mastery Level 2
          </div>
          <div className="mono-tech text-[10px] font-black tracking-[0.1em] text-white/60">
            MADE BY <span className="text-aurora">VINAYAK</span> (codeREDxbt)
          </div>
        </div>
      </footer>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      {/* Background Noise Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02] mix-blend-overlay"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)" }} />
    </main>
  );
}
