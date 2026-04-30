import { Horizon, StrKey, Networks, TransactionBuilder, BASE_FEE, Asset, Operation } from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

export const server = new Horizon.Server(HORIZON_URL);

export async function fetchAccount(publicKey: string) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error('Invalid Stellar public key');
  }
  return server.accounts().accountId(publicKey).call();
}

export async function fetchAccountBalances(publicKey: string) {
  const account = await fetchAccount(publicKey);
  return account.balances;
}

export async function fetchRecentPayments(publicKey: string, limit = 10) {
  const { records } = await server
    .payments()
    .forAccount(publicKey)
    .limit(limit)
    .order('desc')
    .call();
  return records;
}

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) throw new Error('Friendbot funding failed');
}

export async function buildPaymentTransaction(
  sourcePublicKey: string,
  destination: string,
  amount: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(sourcePublicKey);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

export async function submitSignedTransaction(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(tx);
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
