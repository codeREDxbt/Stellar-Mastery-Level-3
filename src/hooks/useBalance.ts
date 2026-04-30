import { useState, useCallback, useEffect } from 'react';
import { stellarCache, CACHE_TTL } from '@/lib/stellar/cache';
import { fetchAccountBalances } from '@/lib/stellar/horizon';

export interface UseBalanceReturn {
  xlmAmount: string;
  allBalances: any[];
  isLoading: boolean;
  isStale: boolean;
  isRevalidating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBalance(publicKey: string | null): UseBalanceReturn {
  const [xlmAmount, setXlmAmount] = useState('0.0000000');
  const [allBalances, setAllBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (background = false) => {
    if (!publicKey) return;
    if (!background) setIsLoading(true);
    else setIsRevalidating(true);
    setError(null);
    try {
      const balances = await fetchAccountBalances(publicKey);
      const native = balances.find((b: any) => b.asset_type === 'native');
      const amount = native?.balance ?? '0.0000000';
      
      stellarCache.set(`balance:${publicKey}`, balances, CACHE_TTL.balance);
      setXlmAmount(amount);
      setAllBalances(balances);
      setIsStale(false);
    } catch (e: any) {
      if (!background) {
        if (e?.response?.status === 404) {
          setError('account_not_funded');
        } else {
          setError(e.message ?? 'Failed to fetch balance');
        }
      }
    } finally {
      if (!background) setIsLoading(false);
      else setIsRevalidating(false);
    }
  }, [publicKey]);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    stellarCache.invalidate(`balance:${publicKey}`);
    await fetchBalance(false);
  }, [publicKey, fetchBalance]);

  useEffect(() => {
    if (!publicKey) {
      setXlmAmount('0.0000000');
      setIsLoading(false);
      setError(null);
      return;
    }
    const cached = stellarCache.get<any[]>(`balance:${publicKey}`);
    if (cached) {
      const native = cached.data.find((b: any) => b.asset_type === 'native');
      setXlmAmount(native?.balance ?? '0.0000000');
      setAllBalances(cached.data);
      setIsStale(cached.isStale);
      if (!cached.isStale) return;
      fetchBalance(true);
    } else {
      fetchBalance(false);
    }
  }, [publicKey, fetchBalance]);

  return { xlmAmount, allBalances, isLoading, isStale, isRevalidating, error, refresh };
}
