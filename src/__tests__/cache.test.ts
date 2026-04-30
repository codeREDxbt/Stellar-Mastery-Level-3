import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StellarCache } from '@/lib/stellar/cache';

describe('StellarCache', () => {
  let cache: StellarCache;

  beforeEach(() => {
    cache = new StellarCache();
  });

  it('stores and retrieves a value', () => {
    cache.set('test:key', { balance: '100' }, 30_000);
    const result = cache.get<{ balance: string }>('test:key');
    expect(result).not.toBeNull();
    expect(result!.data.balance).toBe('100');
  });

  it('returns null for a missing key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('marks entries as stale after TTL expires', () => {
    vi.useFakeTimers();
    cache.set('stale:key', 'value', 1000);
    vi.advanceTimersByTime(2000);
    const result = cache.get('stale:key');
    expect(result!.isStale).toBe(true);
    vi.useRealTimers();
  });

  it('marks fresh entries as not stale', () => {
    cache.set('fresh:key', 'value', 30_000);
    const result = cache.get('fresh:key');
    expect(result!.isStale).toBe(false);
  });

  it('invalidates a specific key', () => {
    cache.set('del:key', 'value', 30_000);
    cache.invalidate('del:key');
    expect(cache.get('del:key')).toBeNull();
  });

  it('invalidates all keys with a given prefix', () => {
    cache.set('balance:GABC', 100, 30_000);
    cache.set('balance:GDEF', 200, 30_000);
    cache.set('payments:GABC', [], 30_000);
    cache.invalidatePrefix('balance:');
    expect(cache.get('balance:GABC')).toBeNull();
    expect(cache.get('balance:GDEF')).toBeNull();
    expect(cache.get('payments:GABC')).not.toBeNull();
  });
});
