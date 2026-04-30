import { describe, it, expect } from 'vitest';
import { formatXLM, shortenKey, formatRelativeDate } from '@/lib/utils/format';

describe('formatXLM', () => {
  it('formats whole number XLM with 2 decimal places', () => {
    expect(formatXLM('1000.0000000')).toBe('1,000.00');
  });

  it('formats fractional XLM stripping trailing zeros to 2 decimal minimum', () => {
    expect(formatXLM('42.5000000')).toBe('42.50');
  });

  it('formats sub-1 XLM values correctly', () => {
    expect(formatXLM('0.1234567')).toBe('0.12');
  });
});

describe('shortenKey', () => {
  it('truncates a full Stellar key to first 6 and last 4 chars', () => {
    const key = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    expect(shortenKey(key)).toBe('GBBD47…FLA5');
  });

  it('returns the key as-is if shorter than 10 chars', () => {
    expect(shortenKey('GABCDE')).toBe('GABCDE');
  });
});

describe('formatRelativeDate', () => {
  it('returns "just now" for timestamps within 60 seconds', () => {
    const recent = new Date(Date.now() - 5000).toISOString();
    expect(formatRelativeDate(recent)).toBe('just now');
  });

  it('returns minutes ago for timestamps 1-59 minutes old', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeDate(fiveMinAgo)).toBe('5 minutes ago');
  });
});
