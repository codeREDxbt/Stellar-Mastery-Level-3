import { describe, it, expect } from 'vitest';
import { isValidStellarKey, isPositiveAmount, isValidPaymentAmount } from '@/lib/utils/validate';

describe('isValidStellarKey', () => {
  it('returns true for a valid Stellar public key', () => {
    expect(isValidStellarKey('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')).toBe(true);
  });

  it('returns false for a random string', () => {
    expect(isValidStellarKey('not-a-stellar-key')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidStellarKey('')).toBe(false);
  });
});

describe('isPositiveAmount', () => {
  it('returns true for "10"', () => {
    expect(isPositiveAmount('10')).toBe(true);
  });

  it('returns true for "0.0000001" (1 stroop)', () => {
    expect(isPositiveAmount('0.0000001')).toBe(true);
  });

  it('returns false for "0"', () => {
    expect(isPositiveAmount('0')).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isPositiveAmount('-5')).toBe(false);
  });

  it('returns false for non-numeric strings', () => {
    expect(isPositiveAmount('abc')).toBe(false);
  });
});

describe('isValidPaymentAmount', () => {
  it('returns error if amount exceeds available balance minus reserve', () => {
    const result = isValidPaymentAmount('10000', '500.0000000');
    expect(result).toBe('Insufficient balance (1 XLM minimum reserve required)');
  });

  it('returns null if amount is valid given sufficient balance', () => {
    const result = isValidPaymentAmount('10', '500.0000000');
    expect(result).toBeNull();
  });
});
