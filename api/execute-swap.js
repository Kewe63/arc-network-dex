import { Wallet, JsonRpcProvider, Contract, parseUnits } from 'ethers';

const RPC_URL = "https://rpc.testnet.arc.network";
const FX_ESCROW = "0xf11aA9A07f6fe684BC0495aDAc8797137dd2e7eF";

const ESCROW_ABI = [
    "function settle(address user, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut, uint256 nonce, uint256 deadline, bytes calldata signature) external",
    "function settleTo(address user, address recipient, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut, uint256 nonce, uint256 deadline, bytes calldata signature) external"
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fromAmount, signature, permitData, isFlipped, userAddr, recipient } = req.body;
    const RELAYER_PK = process.env.RELAYER_PRIVATE_KEY;

    if (!RELAYER_PK) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const USDC_EURC_RATE = 0.92;
        const rate = isFlipped ? 1 / USDC_EURC_RATE : USDC_EURC_RATE;
        const toAmount = (parseFloat(fromAmount) * rate).toFixed(4);

        const provider = new JsonRpcProvider(RPC_URL);
        const relayer = new Wallet(RELAYER_PK, provider);
        const escrow = new Contract(FX_ESCROW, ESCROW_ABI, relayer);

        const USDC_ADDR = "0x3600000000000000000000000000000000000000";
        const EURC_ADDR = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
        const tokenIn = isFlipped ? EURC_ADDR : USDC_ADDR;
        const tokenOut = isFlipped ? USDC_ADDR : EURC_ADDR;

        const amountInRaw = parseUnits(fromAmount, 6);
        const amountOutRaw = parseUnits(toAmount, 6);

        let tx;
        if (recipient) {
            tx = await escrow.settleTo(userAddr, recipient, tokenIn, amountInRaw, tokenOut, amountOutRaw, permitData.nonce, permitData.deadline, signature);
        } else {
            tx = await escrow.settle(userAddr, tokenIn, amountInRaw, tokenOut, amountOutRaw, permitData.nonce, permitData.deadline, signature);
        }

        return res.status(200).json({
            success: true,
            txHash: tx.hash,
            quoteId: "q_" + Math.random().toString(36).slice(2),
            rate,
        });
    } catch (error) {
        console.error("Relayer error:", error);
        return res.status(500).json({ error: error.message || 'Transaction execution failed' });
    }
}
