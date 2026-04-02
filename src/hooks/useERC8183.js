import { useState, useCallback } from 'react';
import { createPublicClient, http, parseUnits, keccak256, toHex, formatUnits } from 'viem';

export const AGENTIC_COMMERCE_CONTRACT = '0x0747EEf0706327138c69792bF28Cd525089e4583';
export const USDC_CONTRACT = '0x3600000000000000000000000000000000000000';

const ARC_TESTNET_CHAIN = {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.network/'] } },
};

const publicClient = createPublicClient({
    chain: ARC_TESTNET_CHAIN,
    transport: http('https://rpc.testnet.arc.network/', { timeout: 15000 }),
});

const ERC8183_ABI = [
    {
        type: "function",
        name: "createJob",
        stateMutability: "nonpayable",
        inputs: [
            { name: "provider", type: "address" },
            { name: "evaluator", type: "address" },
            { name: "expiredAt", type: "uint256" },
            { name: "description", type: "string" },
            { name: "hook", type: "address" },
        ],
        outputs: [{ name: "jobId", type: "uint256" }],
    },
    {
        type: "function",
        name: "setBudget",
        stateMutability: "nonpayable",
        inputs: [
            { name: "jobId", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "optParams", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "fund",
        stateMutability: "nonpayable",
        inputs: [
            { name: "jobId", type: "uint256" },
            { name: "optParams", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "submit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "jobId", type: "uint256" },
            { name: "deliverable", type: "bytes32" },
            { name: "optParams", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "complete",
        stateMutability: "nonpayable",
        inputs: [
            { name: "jobId", type: "uint256" },
            { name: "reason", type: "bytes32" },
            { name: "optParams", type: "bytes" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "getJob",
        stateMutability: "view",
        inputs: [{ name: "jobId", type: "uint256" }],
        outputs: [
            {
                type: "tuple",
                components: [
                    { name: "id", type: "uint256" },
                    { name: "client", type: "address" },
                    { name: "provider", type: "address" },
                    { name: "evaluator", type: "address" },
                    { name: "description", type: "string" },
                    { name: "budget", type: "uint256" },
                    { name: "expiredAt", type: "uint256" },
                    { name: "status", type: "uint8" },
                    { name: "hook", type: "address" },
                ],
            },
        ],
    },
    {
        type: "event",
        name: "JobCreated",
        inputs: [
            { indexed: true, name: "jobId", type: "uint256" },
            { indexed: true, name: "client", type: "address" },
            { indexed: true, name: "provider", type: "address" },
            { indexed: false, name: "evaluator", type: "address" },
            { indexed: false, name: "expiredAt", type: "uint256" },
            { indexed: false, name: "hook", type: "address" },
        ],
        anonymous: false,
    },
];

const USDC_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    }
];

export const JOB_STATUS_NAMES = [
    "Open",
    "Funded",
    "Submitted",
    "Completed",
    "Rejected",
    "Expired",
];

function getInitialState() {
    return { step: 'idle', isLoading: false, error: null, txHash: null, newJobId: null };
}

export function useERC8183(signer, address, isConnected) {
    const [actionState, setActionState] = useState(getInitialState());
    const [jobInfo, setJobInfo] = useState(null);
    const [isFetchingJob, setIsFetchingJob] = useState(false);

    const resetAction = useCallback(() => setActionState(getInitialState()), []);

    const ensureArcNetwork = useCallback(async () => {
        if (!window.ethereum) throw new Error('MetaMask not found');
        const hexId = '0x' + (5042002).toString(16);
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
        } catch (err) {
            if (err.code === 4902 || (err.message && err.message.includes('Unrecognized chain ID'))) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: hexId,
                        chainName: 'Arc Testnet',
                        rpcUrls: ['https://rpc.testnet.arc.network/'],
                        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
                        blockExplorerUrls: ['https://testnet.arcscan.app'],
                    }],
                });
            } else {
                throw err;
            }
        }
        await new Promise(r => setTimeout(r, 800));
    }, []);

    const sendTx = useCallback(async (contractAddress, abi, functionName, args) => {
        const { Contract } = await import('ethers');
        const contract = new Contract(contractAddress, abi, signer);
        const tx = await contract[functionName](...args);
        const receipt = await tx.wait();
        return { txHash: tx.hash, receipt, contract };
    }, [signer]);

    const createJob = useCallback(async (provider, evaluator, description) => {
        if (!isConnected || !address || !signer) return;
        try {
            setActionState({ step: 'switching', isLoading: true, error: null, txHash: null });
            await ensureArcNetwork();

            setActionState({ step: 'creating', isLoading: true, error: null, txHash: null });
            const expiredAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7 days from now
            const hook = '0x0000000000000000000000000000000000000000';

            const { txHash, receipt, contract } = await sendTx(
                AGENTIC_COMMERCE_CONTRACT,
                ERC8183_ABI,
                'createJob',
                [provider, evaluator, expiredAt, description, hook]
            );

            let newJobId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({ topics: log.topics.slice(), data: log.data });
                    if (parsed && parsed.name === 'JobCreated') {
                        newJobId = parsed.args.jobId.toString();
                        break;
                    }
                } catch (e) {}
            }

            setActionState({ step: 'success', isLoading: false, error: null, txHash, newJobId });
        } catch (err) {
            console.error('createJob err:', err);
            setActionState({ step: 'error', isLoading: false, error: err?.message || 'Transaction failed', txHash: null });
        }
    }, [isConnected, address, signer, ensureArcNetwork, sendTx]);

    const setBudget = useCallback(async (jobId, budgetAmountStr) => {
        if (!isConnected || !address || !signer) return;
        try {
            setActionState({ step: 'switching', isLoading: true, error: null, txHash: null });
            await ensureArcNetwork();

            setActionState({ step: 'setting_budget', isLoading: true, error: null, txHash: null });
            const amount = parseUnits(budgetAmountStr, 6);

            const { txHash } = await sendTx(
                AGENTIC_COMMERCE_CONTRACT,
                ERC8183_ABI,
                'setBudget',
                [BigInt(jobId), amount, "0x"]
            );

            setActionState({ step: 'success', isLoading: false, error: null, txHash });
        } catch (err) {
            console.error('setBudget err:', err);
            setActionState({ step: 'error', isLoading: false, error: err?.message || 'Transaction failed', txHash: null });
        }
    }, [isConnected, address, signer, ensureArcNetwork, sendTx]);

    const fundJob = useCallback(async (jobId, budgetAmountStr) => {
        if (!isConnected || !address || !signer) return;
        try {
            setActionState({ step: 'switching', isLoading: true, error: null, txHash: null });
            await ensureArcNetwork();

            setActionState({ step: 'approving', isLoading: true, error: null, txHash: null });
            const amount = parseUnits(budgetAmountStr, 6);
            
            // First approve USDC
            await sendTx(
                USDC_CONTRACT,
                USDC_ABI,
                'approve',
                [AGENTIC_COMMERCE_CONTRACT, amount]
            );

            setActionState({ step: 'funding', isLoading: true, error: null, txHash: null });
            const { txHash } = await sendTx(
                AGENTIC_COMMERCE_CONTRACT,
                ERC8183_ABI,
                'fund',
                [BigInt(jobId), "0x"]
            );

            setActionState({ step: 'success', isLoading: false, error: null, txHash });
        } catch (err) {
            console.error('fundJob err:', err);
            setActionState({ step: 'error', isLoading: false, error: err?.message || 'Transaction failed', txHash: null });
        }
    }, [isConnected, address, signer, ensureArcNetwork, sendTx]);

    const submitDeliverable = useCallback(async (jobId, deliverableText) => {
        if (!isConnected || !address || !signer) return;
        try {
            setActionState({ step: 'switching', isLoading: true, error: null, txHash: null });
            await ensureArcNetwork();

            setActionState({ step: 'submitting', isLoading: true, error: null, txHash: null });
            const deliverableHash = keccak256(toHex(deliverableText || 'arc-erc8183-deliverable'));

            const { txHash } = await sendTx(
                AGENTIC_COMMERCE_CONTRACT,
                ERC8183_ABI,
                'submit',
                [BigInt(jobId), deliverableHash, "0x"]
            );

            setActionState({ step: 'success', isLoading: false, error: null, txHash });
        } catch (err) {
            console.error('submitDeliverable err:', err);
            setActionState({ step: 'error', isLoading: false, error: err?.message || 'Transaction failed', txHash: null });
        }
    }, [isConnected, address, signer, ensureArcNetwork, sendTx]);

    const completeJob = useCallback(async (jobId, reasonText) => {
        if (!isConnected || !address || !signer) return;
        try {
            setActionState({ step: 'switching', isLoading: true, error: null, txHash: null });
            await ensureArcNetwork();

            setActionState({ step: 'completing', isLoading: true, error: null, txHash: null });
            const reasonHash = keccak256(toHex(reasonText || 'deliverable-approved'));

            const { txHash } = await sendTx(
                AGENTIC_COMMERCE_CONTRACT,
                ERC8183_ABI,
                'complete',
                [BigInt(jobId), reasonHash, "0x"]
            );

            setActionState({ step: 'success', isLoading: false, error: null, txHash });
        } catch (err) {
            console.error('completeJob err:', err);
            setActionState({ step: 'error', isLoading: false, error: err?.message || 'Transaction failed', txHash: null });
        }
    }, [isConnected, address, signer, ensureArcNetwork, sendTx]);

    const fetchJob = useCallback(async (jobId) => {
        if (!jobId || isNaN(jobId)) return;
        setIsFetchingJob(true);
        try {
            const jobData = await publicClient.readContract({
                address: AGENTIC_COMMERCE_CONTRACT,
                abi: ERC8183_ABI,
                functionName: 'getJob',
                args: [BigInt(jobId)],
            });
            
            if (jobData) {
                setJobInfo({
                    id: jobData.id.toString(),
                    client: jobData.client,
                    provider: jobData.provider,
                    evaluator: jobData.evaluator,
                    description: jobData.description,
                    budget: formatUnits(jobData.budget, 6),
                    status: JOB_STATUS_NAMES[jobData.status] || 'Unknown',
                });
            }
        } catch (err) {
            console.error('fetchJob err:', err);
            setJobInfo(null);
        } finally {
            setIsFetchingJob(false);
        }
    }, []);

    return {
        actionState,
        resetAction,
        createJob,
        setBudget,
        fundJob,
        submitDeliverable,
        completeJob,
        fetchJob,
        jobInfo,
        isFetchingJob,
    };
}
