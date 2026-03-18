import { Contract, MaxUint256 } from 'ethers';

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const FX_ESCROW = "0xf11aA9A07f6fe684BC0495aDAc8797137dd2e7eF";
const ARC_CHAIN_ID = 5042002;

const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

export const checkPermit2Allowance = async (signer, tokenAddress, amountRaw = 0n) => {
    const address = await signer.getAddress();
    const token = new Contract(tokenAddress, ERC20_ABI, signer);
    const allowance = await token.allowance(address, PERMIT2_ADDRESS);
    if (amountRaw > 0n) {
        return allowance >= amountRaw;
    }
    return allowance > 0n;
};

export const approvePermit2 = async (signer, tokenAddress) => {
    const token = new Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await token.approve(PERMIT2_ADDRESS, MaxUint256);
    await tx.wait();
    return true;
};

export const getArcadeSignature = async (signer, tokenAddress, amountRaw, nonce, deadline) => {
    const domain = {
        name: 'Permit2',
        chainId: ARC_CHAIN_ID,
        verifyingContract: PERMIT2_ADDRESS,
    };

    const types = {
        PermitTransferFrom: [
            { name: 'permitted', type: 'TokenPermissions' },
            { name: 'spender', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
        ],
        TokenPermissions: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
    };

    const message = {
        permitted: { token: tokenAddress, amount: amountRaw },
        spender: FX_ESCROW,
        nonce,
        deadline,
    };

    const signature = await signer.signTypedData(domain, types, message);
    return { signature, permitData: message };
};
