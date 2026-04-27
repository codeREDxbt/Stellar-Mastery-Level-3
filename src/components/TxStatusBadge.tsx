import React from "react";
import { TxStatus } from "../hooks/useSwap";

export function TxStatusBadge({ status }: { status: TxStatus }) {
  if (status === "IDLE") return null;

  const config = {
    PENDING: { color: "bg-amber-500", text: "Pending" },
    SUCCESS: { color: "bg-emerald-500", text: "Success" },
    FAILED: { color: "bg-red-500", text: "Failed" },
  };

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className="relative flex h-2.5 w-2.5">
        {status === "PENDING" && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config[status].color}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config[status].color}`}></span>
      </span>
      {config[status].text}
    </div>
  );
}
