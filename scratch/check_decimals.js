const { rpc, xdr, scValToNative, Address } = require('@stellar/stellar-sdk');
const server = new rpc.Server('https://soroban-testnet.stellar.org');

async function checkDecimals(contractId) {
    const tx = {
        simulate: async () => {
            const result = await server.simulateTransaction({
                toXDR: () => {
                    const op = xdr.Operation.invokeHostFunction({
                        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
                            new xdr.InvokeContractArgs({
                                contractAddress: xdr.ScAddress.scAddressTypeContract(Buffer.from(contractId, 'hex')),
                                functionName: 'decimals',
                                args: []
                            })
                        ),
                        auth: []
                    });
                    // This is a bit simplified, but simulateTransaction can take a raw XDR or Transaction object.
                    // I'll just use a real TransactionBuilder for safety.
                }
            });
        }
    };
    // Let's use a simpler way: getContractData or just a real simulation
}

// Actually, I'll just search for it or use a simpler script.
