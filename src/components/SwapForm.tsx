import React, { useState, useEffect, useCallback } from "react";
import { TxStatus } from "@/hooks/useSwap";
import { toast } from "sonner";

interface Props {
  address: string | null;
  onPlaceOrder: (
    sellToken: string,
    sellAmount: bigint
  ) => Promise<void>;
  onConnect: () => void;
  status: TxStatus;
  error: string | null;
  lastTxHash: string | null;
  reserves: { a: string; b: string };
  userBalances: { rawXlm: string; rawUsdc: string };
}

const ASSETS: Record<string, { code: string; issuer?: string }> = {
  USDC: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  XLM: { code: "XLM" },
};

export function SwapForm({ address, onPlaceOrder, onConnect, status, error, lastTxHash, reserves, userBalances }: Props) {
  const [sellAmount, setSellAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellToken, setSellToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("XLM");
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle Opposite Tokens
  const handleSellTokenChange = (token: string) => {
    setSellToken(token);
    setBuyToken(token === "USDC" ? "XLM" : "USDC");
  };

  const handleBuyTokenChange = (token: string) => {
    setBuyToken(token);
    setSellToken(token === "USDC" ? "XLM" : "USDC");
  };

  // Price Calculation based on Pool Reserves
  useEffect(() => {
    if (!sellAmount || isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) <= 0) {
      setBuyPrice("");
      return;
    }

    const amount = parseFloat(sellAmount);
    const resA = parseFloat(reserves.a); // USDC
    const resB = parseFloat(reserves.b); // XLM

    if (resA === 0 || resB === 0) {
      setBuyPrice("0.00");
      return;
    }

    const currentReserve = sellToken === "USDC" ? resA : resB;
    if (amount > currentReserve * 0.1) {
      toast.warning("High Slippage Warning", {
        description: "Swap size exceeds 10% of pool reserves. Price impact will be significant.",
        id: "slippage-warning"
      });
    }

    if (sellToken === "USDC") {
      // Selling USDC for XLM
      // Constant Product: (resA * resB) / (resA + amount) = newResB
      // buyAmount = resB - newResB
      const buyAmt = resB - (resA * resB) / (resA + amount);
      setBuyPrice(buyAmt.toFixed(7));
    } else {
      // Selling XLM for USDC
      const buyAmt = resA - (resA * resB) / (resB + amount);
      setBuyPrice(buyAmt.toFixed(7));
    }
  }, [sellAmount, sellToken, reserves]);

  // Handle transaction success/error with toasts
  useEffect(() => {
    if (status === "SUCCESS") {
      toast.success("Swap Successful", {
        description: "Your tokens have been successfully exchanged.",
      });
    } else if (status === "FAILED" && error) {
      toast.error("Swap Failed", {
        description: error,
      });
    }
  }, [status, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!sellAmount) return;
    const amountNum = parseFloat(sellAmount);
    
    // Check User Balance
    const userBalance = sellToken === "USDC" ? parseFloat(userBalances.rawUsdc) : parseFloat(userBalances.rawXlm);
    if (amountNum > userBalance) {
      const msg = "Insufficient wallet balance for this swap";
      setLocalError(msg);
      toast.error("Validation Error", { description: msg });
      return;
    }

    // Check Pool Reserves (Warning/Error)
    const reserveIn = sellToken === "USDC" ? parseFloat(reserves.a) : parseFloat(reserves.b);
    if (amountNum > reserveIn * 0.9) {
      const msg = "Amount exceeds 90% of pool reserves. Trade restricted.";
      setLocalError(msg);
      toast.error("Safety Block", { description: msg });
      return;
    }

    const amount = BigInt(Math.floor(amountNum * 1e7));
    onPlaceOrder(sellToken, amount);
  };

  const isPending = status === "PENDING";
  const displayError = localError || error;

  const handleMax = () => {
    const balance = sellToken === "USDC" ? userBalances.rawUsdc : userBalances.rawXlm;
    setSellAmount(balance);
  };

  return (
    <div className="glass-panel rounded-lg flex flex-col shadow-2xl h-[620px]">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-neon" />
          <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Execution Terminal</h3>
        </div>
        <div className="mono-tech text-[9px] text-white/30 uppercase">Node_Stable</div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Sell Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="mono-tech text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Liquefy Asset</label>
              <button 
                type="button"
                onClick={handleMax}
                className="mono-tech text-[9px] text-primary/60 hover:text-primary uppercase font-bold transition-colors"
              >
                Use_Max: {sellToken === "USDC" ? parseFloat(userBalances.rawUsdc).toFixed(2) : parseFloat(userBalances.rawXlm).toFixed(2)}
              </button>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded border border-white/5 focus-within:border-primary/30 transition-all">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="bg-transparent text-3xl font-black text-white outline-none w-full placeholder:text-white/5 tracking-tighter"
                disabled={isPending}
              />
              <select 
                value={sellToken}
                onChange={(e) => handleSellTokenChange(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-primary shadow-neon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 10l5 5 5-5"/></svg>
            </div>
          </div>

          {/* Buy Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <label className="mono-tech text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Target Rate</label>
              <span className={`mono-tech text-[9px] ${isFetchingPrice ? "text-primary animate-pulse" : "text-primary font-black"}`}>
                {isFetchingPrice ? "SYNCING_POOL..." : "MARKET_SYNC"}
              </span>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] p-6 rounded border border-white/5 focus-within:border-secondary/30 transition-all">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="bg-transparent text-3xl font-black text-white outline-none w-full placeholder:text-white/5 tracking-tighter"
                disabled={isPending}
              />
              <select 
                value={buyToken}
                onChange={(e) => handleBuyTokenChange(e.target.value)}
                className="bg-surface text-white rounded px-3 py-1.5 font-bold text-[10px] outline-none border border-white/10 mono-tech cursor-pointer"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-auto">
          <div className="min-h-[30px]">
            {displayError && (
              <div className="text-[10px] mono-tech font-bold text-danger uppercase tracking-tight animate-in fade-in">
                &gt; ERROR: {displayError}
              </div>
            )}
            {status === "SUCCESS" && !displayError && (
              <div className="space-y-2 animate-in fade-in">
                <div className="text-[10px] mono-tech font-bold text-primary uppercase tracking-tight">
                  &gt; BROADCAST_SUCCESS: LEDGER_CONFIRMED
                </div>
                {lastTxHash && (
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[9px] mono-tech text-primary/60 hover:text-primary underline decoration-primary/20 transition-colors uppercase tracking-widest"
                  >
                    VIEW_ON_EXPLORER [HASH: {lastTxHash.slice(0, 8)}...]
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            type={address ? "submit" : "button"}
            onClick={address ? undefined : (e) => { e.preventDefault(); onConnect(); }}
            disabled={isPending || (!!address && (!sellAmount || !buyPrice))}
            className={`w-full py-5 rounded font-black text-[10px] uppercase tracking-[0.5em] transition-all relative overflow-hidden ${
              isPending 
                ? "bg-white/5 text-text-muted cursor-not-allowed" 
                : "bg-white text-black hover:bg-primary hover:shadow-neon active:scale-[0.98]"
            }`}
          >
            {isPending ? "Balancing_Pool..." : address ? "Instant_Swap" : "Connect_to_Swap"}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] p-4 rounded border border-white/5">
              <span className="text-[7px] text-text-muted uppercase font-black tracking-widest block mb-1">Network Fee</span>
              <span className="mono-tech text-[10px]">0.00001 <span className="opacity-30">XLM</span></span>
            </div>
            <div className="bg-white/[0.02] p-4 rounded border border-white/5">
              <span className="text-[7px] text-text-muted uppercase font-black tracking-widest block mb-1">Impact</span>
              <span className="mono-tech text-[10px] text-primary">
                {sellAmount && buyPrice && parseFloat(sellAmount) > 0 ? (
                  (() => {
                    const resIn = sellToken === "USDC" ? parseFloat(reserves.a) : parseFloat(reserves.b);
                    const resOut = sellToken === "USDC" ? parseFloat(reserves.b) : parseFloat(reserves.a);
                    const spotPrice = resOut / resIn;
                    const effectivePrice = parseFloat(buyPrice) / parseFloat(sellAmount);
                    const impact = Math.max(0, (1 - (effectivePrice / spotPrice)) * 100);
                    return impact < 0.01 ? "< 0.01%" : `${impact.toFixed(2)}%`;
                  })()
                ) : "0.00%"}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

