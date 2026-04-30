import { StrKey } from '@stellar/stellar-sdk';

export function isValidStellarKey(key: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(key);
  } catch {
    return false;
  }
}

export function isPositiveAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function isValidPaymentAmount(amount: string, balanceStr: string): string | null {
  const num = parseFloat(amount);
  const balance = parseFloat(balanceStr);
  const MINIMUM_RESERVE = 1;
  if (num > balance - MINIMUM_RESERVE) {
    return 'Insufficient balance (1 XLM minimum reserve required)';
  }
  return null;
}
