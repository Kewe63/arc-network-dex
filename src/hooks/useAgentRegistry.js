import { useState, useCallback } from 'react';
import { createPublicClient, http, parseAbiItem, getContract, keccak256, toHex } from 'viem';

export const IDENTITY_REGISTRY   = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
export const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
export const VALIDATION_REGISTRY = '0x8004Cb1BF31DAf7788923b405b754f57acEB4272';

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

const IDENTITY_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const REPUTATION_ABI = [
  {
    name: 'giveFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'score', type: 'int128' },
      { name: 'category', type: 'uint8' },
      { name: 'tag', type: 'string' },
      { name: 'context', type: 'string' },
      { name: 'evidence', type: 'string' },
      { name: 'metadataURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
];

const VALIDATION_ABI = [
  {
    name: 'validationRequest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'validator', type: 'address' },
      { name: 'agentId', type: 'uint256' },
      { name: 'requestURI', type: 'string' },
      { name: 'requestHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'getValidationStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'requestHash', type: 'bytes32' }],
    outputs: [
      { name: 'validatorAddress', type: 'address' },
      { name: 'agentId', type: 'uint256' },
      { name: 'response', type: 'uint8' },
      { name: 'responseHash', type: 'bytes32' },
      { name: 'tag', type: 'string' },
      { name: 'lastUpdate', type: 'uint256' },
    ],
  },
];

function getInitialState() {
  return { step: 'idle', isLoading: false, error: null, txHash: null };
}

export function useAgentRegistry(signer, address, isConnected) {
  const [registerState, setRegisterState]     = useState(getInitialState());
  const [reputationState, setReputationState] = useState(getInitialState());
  const [validationState, setValidationState] = useState(getInitialState());
  const [agentInfo, setAgentInfo]             = useState(null);
  const [isFetchingAgent, setIsFetchingAgent] = useState(false);

  // Switch wallet to Arc Testnet
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

  // Send a transaction via ethers signer
  const sendTx = useCallback(async (contractAddress, abi, functionName, args) => {
    const { Contract } = await import('ethers');
    const contract = new Contract(contractAddress, abi, signer);
    const tx = await contract[functionName](...args);
    await tx.wait();
    return tx.hash;
  }, [signer]);

  // Register agent identity
  const registerAgent = useCallback(async (metadataURI) => {
    if (!isConnected || !signer) {
      setRegisterState(s => ({ ...s, error: 'Please connect your wallet first' }));
      return;
    }
    setRegisterState({ step: 'switching', isLoading: true, error: null, txHash: null });
    try {
      await ensureArcNetwork();
      setRegisterState(s => ({ ...s, step: 'registering' }));
      const txHash = await sendTx(IDENTITY_REGISTRY, IDENTITY_ABI, 'register', [metadataURI]);
      setRegisterState({ step: 'success', isLoading: false, error: null, txHash });
    } catch (err) {
      const msg = err.code === 4001 || err.message?.includes('user rejected')
        ? 'Transaction rejected in wallet'
        : err.message || 'Registration failed';
      setRegisterState({ step: 'error', isLoading: false, error: msg, txHash: null });
    }
  }, [isConnected, signer, ensureArcNetwork, sendTx]);

  // Fetch agent info from chain
  const fetchAgentInfo = useCallback(async () => {
    if (!address) return;
    setIsFetchingAgent(true);
    try {
      const identityContract = getContract({
        address: IDENTITY_REGISTRY,
        abi: IDENTITY_ABI,
        client: publicClient,
      });

      // Try tokenOfOwnerByIndex first, fallback to Transfer event scan
      let agentId = null;
      let metadataURI = null;

      try {
        const balance = await identityContract.read.balanceOf([address]);
        if (balance > 0n) {
          agentId = await identityContract.read.tokenOfOwnerByIndex([address, 0n]);
          metadataURI = await identityContract.read.tokenURI([agentId]);
        }
      } catch {
        // Fallback: scan Transfer events
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;
        const logs = await publicClient.getLogs({
          address: IDENTITY_REGISTRY,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
          args: { to: address },
          fromBlock,
          toBlock: latestBlock,
        });
        if (logs.length > 0) {
          agentId = logs[logs.length - 1].args.tokenId;
          try {
            metadataURI = await identityContract.read.tokenURI([agentId]);
          } catch { metadataURI = null; }
        }
      }

      if (agentId !== null) {
        setAgentInfo({ agentId: agentId.toString(), metadataURI, owner: address });
      } else {
        setAgentInfo(null);
      }
    } catch (err) {
      console.warn('fetchAgentInfo error:', err.message);
      setAgentInfo(null);
    } finally {
      setIsFetchingAgent(false);
    }
  }, [address]);

  // Give reputation feedback
  const giveFeedback = useCallback(async (agentId, score, tag) => {
    if (!isConnected || !signer) {
      setReputationState(s => ({ ...s, error: 'Wallet not connected' }));
      return;
    }
    setReputationState({ step: 'switching', isLoading: true, error: null, txHash: null });
    try {
      await ensureArcNetwork();
      setReputationState(s => ({ ...s, step: 'sending' }));
      const feedbackHash = keccak256(toHex(tag));
      const txHash = await sendTx(
        REPUTATION_REGISTRY,
        REPUTATION_ABI,
        'giveFeedback',
        [BigInt(agentId), BigInt(score), 0, tag, '', '', '', feedbackHash]
      );
      setReputationState({ step: 'success', isLoading: false, error: null, txHash });
    } catch (err) {
      const msg = err.code === 4001 || err.message?.includes('user rejected')
        ? 'Transaction rejected in wallet'
        : err.message || 'Feedback failed';
      setReputationState({ step: 'error', isLoading: false, error: msg, txHash: null });
    }
  }, [isConnected, signer, ensureArcNetwork, sendTx]);

  // Request validation
  const requestValidation = useCallback(async (agentId, validatorAddress) => {
    if (!isConnected || !signer) {
      setValidationState(s => ({ ...s, error: 'Wallet not connected' }));
      return;
    }
    setValidationState({ step: 'switching', isLoading: true, error: null, txHash: null });
    try {
      await ensureArcNetwork();
      setValidationState(s => ({ ...s, step: 'sending' }));
      const requestURI  = 'ipfs://bafkreiexamplevalidationrequest';
      const requestHash = keccak256(toHex(`kyc_verification_request_agent_${agentId}`));
      const txHash = await sendTx(
        VALIDATION_REGISTRY,
        VALIDATION_ABI,
        'validationRequest',
        [validatorAddress, BigInt(agentId), requestURI, requestHash]
      );
      setValidationState({ step: 'success', isLoading: false, error: null, txHash });
    } catch (err) {
      const msg = err.code === 4001 || err.message?.includes('user rejected')
        ? 'Transaction rejected in wallet'
        : err.message || 'Validation request failed';
      setValidationState({ step: 'error', isLoading: false, error: msg, txHash: null });
    }
  }, [isConnected, signer, ensureArcNetwork, sendTx]);

  const resetRegister   = useCallback(() => setRegisterState(getInitialState()), []);
  const resetReputation = useCallback(() => setReputationState(getInitialState()), []);
  const resetValidation = useCallback(() => setValidationState(getInitialState()), []);

  return {
    registerAgent, registerState, resetRegister,
    giveFeedback,  reputationState, resetReputation,
    requestValidation, validationState, resetValidation,
    fetchAgentInfo, agentInfo, isFetchingAgent,
  };
}
