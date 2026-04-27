
const { Asset, Networks } = require("@stellar/stellar-sdk");

const networkPassphrase = Networks.TESTNET;
const usdcAsset = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const xlmAsset = Asset.native();

console.log("USDC Contract ID:", usdcAsset.contractId(networkPassphrase));
console.log("XLM Contract ID:", xlmAsset.contractId(networkPassphrase));
