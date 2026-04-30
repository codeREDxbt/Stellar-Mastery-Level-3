"use client";
import React, { useState } from "react";
import { buildPaymentTransaction, submitSignedTransaction } from "@/lib/stellar/horizon";
import { isValidStellarKey, isPositiveAmount, isValidPaymentAmount } from "@/lib/utils/validate";
import { TxStatusModal } from "./TxStatusModal";
import { toast } from "sonner";

interface Props {
  address: string;
  xlmBalance: string;
  sign: (xdr: string) => Promise<string>;
  onSuccess: () => void;
}

function parseHorizonError(e: any): string {
  const extras = e?.response?.data?.extras?.result_codes;
  if (extras?.operations?.includes("op_underfunded")) return "Insufficient balance. Remember: 1 XLM minimum reserve is required.";
  if (extras?.operations?.includes("op_no_destination")) return "Destination account doesn't exist on the network yet.";
  if (e?.message?.includes("timeout")) return "Transaction timed out. Check Stellar Expert with the hash if this happens again.";
  return extras?.transaction ?? e?.message ?? "Network error. Check your connection and try again.";
}

export function SendForm({ address, xlmBalance, sign, onSuccess }: Props) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [destError, setDestError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalStatus, setModalStatus] = useState<"pending" | "success" | "error">("pending");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const isPending = modalOpen && modalStatus === "pending";

  const validate = (): boolean => {
    let valid = true;
    if (!destination) { setDestError("Destination address is required"); valid = false; }
    else if (!isValidStellarKey(destination)) { setDestError("Invalid Stellar address"); valid = false; }
    else if (destination === address) { setDestError("Cannot send to your own address"); valid = false; }
    else setDestError(null);

    if (!amount) { setAmountError("Amount is required"); valid = false; }
    else if (!isPositiveAmount(amount)) { setAmountError("Enter a valid positive amount"); valid = false; }
    else {
      const err = isValidPaymentAmount(amount, xlmBalance);
      if (err) { setAmountError(err); valid = false; }
      else setAmountError(null);
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setModalOpen(true);
    setModalStep(0);
    setModalStatus("pending");
    setTxHash(null);
    setModalError(null);

    try {
      const xdr = await buildPaymentTransaction(address, destination, amount);
      const signedXdr = await sign(xdr);
      setModalStep(1);
      await new Promise(r => setTimeout(r, 400));
      setModalStep(2);
      const result = await submitSignedTransaction(signedXdr);
      setModalStep(3);
      await new Promise(r => setTimeout(r, 500));
      setTxHash((result as any).hash ?? null);
      setModalStatus("success");
      onSuccess();
      setDestination("");
      setAmount("");
    } catch (e: any) {
      const msg = parseHorizonError(e);
      setModalError(msg);
      setModalStatus("error");
      toast.error("Transaction Failed", { description: msg });
    }
  };

  const handleMax = () => {
    const max = Math.max(0, parseFloat(xlmBalance || "1") - 1).toFixed(7);
    setAmount(max);
    if (amountError) setAmountError(null);
  };

  return (
    <>
      <TxStatusModal
        isOpen={modalOpen}
        step={modalStep}
        status={modalStatus}
        txHash={txHash}
        errorMessage={modalError}
        onClose={() => { if (modalStatus !== "pending") { setModalOpen(false); setModalStep(0); setModalStatus("pending"); } }}
      />

      <div className="glass-panel rounded-lg flex flex-col shadow-2xl max-w-lg mx-auto w-full">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h3 className="mono-tech text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Send_Payment</h3>
          </div>
          <div className="mono-tech text-[9px] text-white/30 uppercase">XLM · Testnet</div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-7">
          {/* Destination */}
          <div>
            <label htmlFor="send-dest" className="mono-tech text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-2">
              Destination Address
            </label>
            <input
              id="send-dest"
              type="text"
              value={destination}
              onChange={e => { setDestination(e.target.value); if (destError) setDestError(null); }}
              placeholder="G..."
              disabled={isPending}
              aria-describedby={destError ? "dest-error" : undefined}
              className="w-full bg-white/[0.03] border border-white/5 focus:border-primary/30 rounded px-4 py-3 text-sm text-white placeholder:text-white/10 outline-none transition-colors mono-tech disabled:opacity-40"
            />
            {destError && (
              <p id="dest-error" role="alert" className="mt-1.5 mono-tech text-[9px] font-bold text-danger uppercase tracking-tight">
                &gt; {destError}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="send-amount" className="mono-tech text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">
                Amount (XLM)
              </label>
              <button
                type="button"
                onClick={handleMax}
                disabled={isPending}
                className="mono-tech text-[9px] text-primary/60 hover:text-primary uppercase font-bold transition-colors disabled:opacity-30"
              >
                Max: {Math.max(0, parseFloat(xlmBalance || "1") - 1).toFixed(2)}
              </button>
            </div>
            <input
              id="send-amount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); if (amountError) setAmountError(null); }}
              placeholder="0.00"
              disabled={isPending}
              aria-describedby={amountError ? "amount-error" : undefined}
              className="w-full bg-white/[0.03] border border-white/5 focus:border-primary/30 rounded px-4 py-3 text-3xl font-black text-white placeholder:text-white/5 outline-none transition-colors tracking-tighter disabled:opacity-40"
            />
            {amountError && (
              <p id="amount-error" role="alert" className="mt-1.5 mono-tech text-[9px] font-bold text-danger uppercase tracking-tight">
                &gt; {amountError}
              </p>
            )}
          </div>

          {/* Fee info */}
          <div className="bg-white/[0.02] border border-white/5 rounded p-3 flex justify-between">
            <span className="mono-tech text-[8px] text-white/30 uppercase tracking-widest">Network Fee</span>
            <span className="mono-tech text-[9px] text-white/50">0.00001 XLM</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded bg-white text-black font-black mono-tech text-[10px] uppercase tracking-[0.5em] hover:bg-primary hover:shadow-[0_0_20px_rgba(0,245,255,0.15)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isPending ? "Processing…" : "Send_Payment"}
          </button>
        </form>
      </div>
    </>
  );
}
