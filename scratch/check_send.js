const { rpc } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');
// Just checking types and keys of a dummy response if possible or just logging the prototype
console.log('SendTransaction response possible keys (estimate):', [
    'hash', 'status', 'errorResultXdr', 'diagnosticEvents'
]);
