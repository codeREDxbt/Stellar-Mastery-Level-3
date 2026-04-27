const { rpc } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');
// Just checking if sendTransaction can take a string
console.log('sendTransaction signature:', server.sendTransaction.toString());
