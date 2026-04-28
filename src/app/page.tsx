"use client";

import { useWallet } from "@/hooks/useWallet";
import { useSwap } from "@/hooks/useSwap";
import { useEvents } from "@/hooks/useEvents";
import { useBalances } from "@/hooks/useBalances";
import Link from "next/link";
import { WalletConnector } from "@/components/WalletConnector";
import { SwapForm } from "@/components/SwapForm";
import { EventFeed } from "@/components/EventFeed";
import { LiquidityPool } from "@/components/LiquidityPool";
import { BalanceDisplay } from "@/components/BalanceDisplay";

export default function Home() {
  const { address, error: walletError, connect, disconnect, sign } = useWallet();
  const { xlm, usdc, rawXlm, rawUsdc, loading: balancesLoading } = useBalances(address);
  const { status, error, lastTxHash, reserves, deposit, instantSwap, fetchReserves } = useSwap(address, sign);
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

      <div className={`flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-12 lg:py-16 ${!address ? 'justify-center' : ''}`}>
        <div className="max-w-4xl mx-auto text-center space-y-12 mb-16 animate-in fade-in duration-1000">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded bg-white/5 border border-white/10 mono-tech text-[9px] text-primary tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-neon" />
            SYSTEM_STATUS: ONLINE
          </div>

          <h2 className="text-7xl lg:text-9xl font-black tracking-tighter leading-[0.8] uppercase italic">
            Stellar <br />
            <span className="text-aurora">LIQUIDITY</span>
          </h2>

          <p className="text-xl lg:text-2xl text-white/40 max-w-3xl mx-auto font-medium leading-tight tracking-tight">
            Institutional-grade swap infrastructure. <br />
            Zero slippage targets. Pure execution.
          </p>

          {walletError && (
            <div className="text-[10px] mono-tech font-bold text-danger uppercase tracking-widest animate-in slide-in-from-top-2 duration-500">
              &gt; CONNECTION_FAILURE: {walletError}
            </div>
          )}

          {!address && (
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={connect}
                className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                Connect Wallet
              </button>
              <Link 
                href="/docs"
                className="w-full sm:w-auto px-12 py-5 rounded border border-white/10 bg-white/[0.02] text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 hover:border-white/20 transition-all text-center"
              >
                Documentation
              </Link>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 ${address ? 'lg:grid-cols-2' : 'hidden'} gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700`}>
          {/* Swap Terminal Column */}
          <div className="space-y-8">
            {address && <BalanceDisplay address={address} />}
            {address && (
              <SwapForm 
                address={address} 
                onPlaceOrder={instantSwap} 
                onConnect={connect}
                status={status} 
                error={error} 
                lastTxHash={lastTxHash}
                reserves={reserves}
                userBalances={{ rawXlm, rawUsdc }}
              />
            )}
          </div>

          {/* Activity Log Column */}
          {address && (
            <div className="h-full">
              <EventFeed payments={payments} contractEvents={contractEvents} isLive={isLive} publicKey={address} />
            </div>
          )}
        </div>

        {/* Liquidity Pool - Centered Below when Connected */}
        {address && (
          <div className="mt-12 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <LiquidityPool 
              address={address}
              reserves={reserves} 
              onDeposit={deposit} 
              onConnect={connect}
              status={status} 
              fetchReserves={fetchReserves} 
              userBalances={{ rawXlm, rawUsdc }}
            />
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
