import React, { useEffect, useState, useCallback } from 'react';
import { useSwap, OrderData } from '../hooks/useSwap';

interface OrderListProps {
  address: string | null;
  sign: (xdr: string) => Promise<string>;
}

const OrderList: React.FC<OrderListProps> = ({ address, sign }) => {
  const { fetchOrders, cancelOrder, fillOrder, status } = useSwap(address, sign);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await fetchOrders();
    setOrders(data);
    setLoading(false);
  }, [fetchOrders]);

  useEffect(() => {
    loadOrders();
    
    // Refresh when a new order is placed
    window.addEventListener('stellar:orders_updated', loadOrders);
    return () => window.removeEventListener('stellar:orders_updated', loadOrders);
  }, [loadOrders]);

  const formatAmount = (amt: bigint) => (Number(amt) / 1e7).toFixed(2);

  if (loading && orders.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 animate-pulse">
        Scanning Ledger for Orders...
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">Active Protocol Orders</h2>
        <button 
          onClick={loadOrders}
          className="text-xs text-cyan-400 hover:text-cyan-300 uppercase tracking-widest"
        >
          Refresh Feed
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-800 rounded-2xl text-center">
          <p className="text-gray-600 text-sm italic">No active orders found in the protocol footprint.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="group p-4 bg-gray-900/40 border border-gray-800 rounded-2xl hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-mono text-gray-400">#{order.id}</span>
                    <span className="text-sm font-medium text-white">
                      {formatAmount(order.sellAmount)} {order.sellToken.includes('USCI') ? 'USDC' : 'XLM'}
                    </span>
                    <span className="text-gray-600 text-xs">→</span>
                    <span className="text-sm font-medium text-cyan-400">
                      {formatAmount(order.buyPrice)} {order.buyToken.includes('USCI') ? 'USDC' : 'XLM'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono truncate w-48">
                    Owner: {order.seller}
                  </p>
                </div>

                <div className="flex gap-2">
                  {address === order.seller ? (
                    <button
                      disabled={status === 'PENDING'}
                      onClick={() => cancelOrder(order.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                    >
                      CANCEL
                    </button>
                  ) : (
                    <button
                      disabled={status === 'PENDING'}
                      onClick={() => fillOrder(order.id)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/20 transition-colors disabled:opacity-50"
                    >
                      FILL ORDER
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;
