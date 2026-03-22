import { Contract, MaxUint256 } from 'ethers';

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const FX_ESCROW      = '0xf11aA9A07f6fe684BC0495aDAc8797137dd2e7eF';
const ARC_CHAIN_ID   = 5042002;

const ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
];

const PERMIT2_TYPES = {
    PermitTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender',   type: 'address' },
        { name: 'nonce',     type: 'uint256' },
        { name: 'deadline',  type: 'uint256' },
    ],
    TokenPermissions: [
        { name: 'token',  type: 'address' },
        { name: 'amount', type: 'uint256' },
    ],
};

const permit2Domain = {
    name: 'Permit2',
    chainId: ARC_CHAIN_ID,
    verifyingContract: PERMIT2_ADDRESS,
};

export async function checkPermit2Allowance(signer, tokenAddress, amountRaw = 0n) {
    const owner   = await signer.getAddress();
    const token   = new Contract(tokenAddress, ERC20_ABI, signer);
    const allowed = await token.allowance(owner, PERMIT2_ADDRESS);
    return amountRaw > 0n ? allowed >= amountRaw : allowed > 0n;
}

export async function approvePermit2(signer, tokenAddress) {
    const token = new Contract(tokenAddress, ERC20_ABI, signer);
    const tx    = await token.approve(PERMIT2_ADDRESS, MaxUint256);
    await tx.wait();
    return true;
}

export async function buildPermitSignature(signer, tokenAddress, amountRaw, nonce, deadline) {
    const message = {
        permitted: { token: tokenAddress, amount: amountRaw },
        spender:   FX_ESCROW,
        nonce,
        deadline,
    };
    const signature = await signer.signTypedData(permit2Domain, PERMIT2_TYPES, message);
    return { signature, permitData: message };
}

// eski isimle export — SwapCard geriye uyumlu kalsın
export const getArcadeSignature = buildPermitSignature;
