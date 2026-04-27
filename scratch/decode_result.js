const { xdr, scValToNative } = require('@stellar/stellar-sdk');
const xdrString = 'AAAAAAAAKD//////AAAAAQAAAAAAAAAY/////gAAAAA=';
const result = xdr.TransactionResult.fromXDR(xdrString, 'base64');
console.log('Result Name:', result.result().switch().name);

const tr = result.result().results()[0].tr().invokeHostFunctionResult();
console.log('Invoke Result Switch:', tr.switch().name);

// If it trapped, we might not get a return value here, but let's check the events if they were in the JSON
// Wait, the user didn't provide events.
