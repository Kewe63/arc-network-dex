export const ensureArcNetwork = async () => {
    if (!window.ethereum) throw new Error("No crypto wallet found");

    const chainId = 5042002;
    const hexChainId = "0x" + chainId.toString(16);

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
        });
    } catch (switchError) {
        const isNotAdded =
            switchError.code === 4902 ||
            switchError.data?.originalError?.code === 4902 ||
            (switchError.message && switchError.message.includes('Unrecognized chain ID'));

        if (isNotAdded) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: hexChainId,
                            chainName: "Arc Testnet",
                            rpcUrls: ["https://rpc.testnet.arc.network"],
                            nativeCurrency: {
                                name: "USDC",
                                symbol: "USDC",
                                decimals: 18,
                            },
                            blockExplorerUrls: ["https://testnet.arcscan.app"],
                        },
                    ],
                });
            } catch (addError) {
                throw new Error("Failed to add Arc network");
            }
        } else {
            throw switchError;
        }
    }
};
