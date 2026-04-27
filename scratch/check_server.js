const { rpc } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');
console.log('Server methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(server)));
