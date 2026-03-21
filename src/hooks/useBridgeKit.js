import { useState, useCallback, useEffect } from 'react';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createPublicClient, http, parseAbi } from 'viem';

export const SEPOLIA_CHAIN_ID = 11155111;
export const ARC_CHAIN_ID = 5042002;

const CHAIN_NAMES = {
  [SEPOLIA_CHAIN_ID]: 'Sepolia',
  [ARC_CHAIN_ID]: 'Arc Testnet',
};

// BridgeKit'in beklediği chain string identifier'ları
const BRIDGE_CHAIN_IDS = {
  [SEPOLIA_CHAIN_ID]: 'Ethereum_Sepolia',
  [ARC_CHAIN_ID]: 'Arc_Testnet',
};

const CHAIN_TOKENS = {
  [SEPOLIA_CHAIN_ID]: {
    USDC: {
      symbol: 'USDC',
      decimals: 6,
      contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
  },
  [ARC_CHAIN_ID]: {
    USDC: {
      symbol: 'USDC',
      decimals: 6,
      contractAddress: '0x3600000000000000000000000000000000000000',
    },
  },
};

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
]);

const createClientWithTimeout = (url) =>
  createPublicClient({
    transport: http(url, { timeout: 8000, retryCount: 1 }),
  });

const publicClients = {
  [SEPOLIA_CHAIN_ID]: createClientWithTimeout('https://sepolia.drpc.org'),
  [ARC_CHAIN_ID]: createClientWithTimeout('https://rpc.testnet.arc.network/'),
};

let bridgeKitInstance = null;

function getBridgeKit() {
  if (!bridgeKitInstance) {
    bridgeKitInstance = new BridgeKit();
  }
  return bridgeKitInstance;
}

function getInitialState() {
  return {
    step: 'idle',
    error: null,
    result: null,
    isLoading: false,
    sourceTxHash: undefined,
    receiveTxHash: undefined,
    direction: undefined,
  };
}

export function useBridgeKit(address, isConnected) {
  const [state, setState] = useState(getInitialState());
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  useEffect(() => {
    try {
      getBridgeKit();
      console.log('✅ Bridge Kit initialized');
    } catch (err) {
      console.error('❌ Failed to initialize Bridge Kit:', err);
    }
  }, []);

  const fetchTokenBalance = useCallback(
    async (token, targetChainId) => {
      if (!address) { setTokenBalance('0'); return; }
      setIsLoadingBalance(true);
      setBalanceError('');
      try {
        const tokenInfo = CHAIN_TOKENS[targetChainId]?.[token];
        if (!tokenInfo) throw new Error(`Token ${token} not found on chain ${targetChainId}`);
        const publicClient = publicClients[targetChainId];
        if (!publicClient) throw new Error(`No client for chain ${targetChainId}`);
        const balance = await publicClient.readContract({
          address: tokenInfo.contractAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
        const balanceFloat = Number(balance) / Math.pow(10, tokenInfo.decimals);
        setTokenBalance(balanceFloat.toFixed(6));
        setBalanceError('');
      } catch (err) {
        console.warn(`⚠️ Balance fetch failed (${err.message})`);
        setBalanceError('Could not fetch balance');
        setTokenBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    },
    [address]
  );

  const reset = useCallback(() => { setState(getInitialState()); }, []);

  const switchToChain = useCallback(async (targetChainId) => {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const hexId = '0x' + targetChainId.toString(16);
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } catch (switchErr) {
      const notAdded = switchErr.code === 4902 ||
        (switchErr.message && switchErr.message.includes('Unrecognized chain ID'));
      if (notAdded && targetChainId === SEPOLIA_CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hexId,
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://sepolia.drpc.org'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else if (notAdded && targetChainId === ARC_CHAIN_ID) {
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
        throw switchErr;
      }
    }
  }, []);

  const bridge = useCallback(
    async (token, amount, direction) => {
      if (!isConnected || !address) {
        setState({ ...getInitialState(), step: 'error', error: 'Please connect your wallet first' });
        return;
      }
      if (!amount || parseFloat(amount) <= 0) {
        setState({ ...getInitialState(), step: 'error', error: 'Please enter a valid amount' });
        return;
      }
      if (!window.ethereum) {
        setState({ ...getInitialState(), step: 'error', error: 'MetaMask not found. Please install MetaMask.' });
        return;
      }

      try {
        window.__bridgeInProgress = true;
        setState({ ...getInitialState(), isLoading: true, direction });

        const kit = getBridgeKit();

        // Event listener'larla adım takibi
        const onApprove = () => setState(prev => ({ ...prev, step: 'approving' }));
        const onBurn = () => setState(prev => ({ ...prev, step: 'signing-bridge' }));
        const onFetchAttestation = () => setState(prev => ({ ...prev, step: 'waiting-receive-message' }));

        kit.on('approve', onApprove);
        kit.on('burn', onBurn);
        kit.on('fetchAttestation', onFetchAttestation);

        setState(prev => ({ ...prev, step: 'switching-network' }));

        const isSepoliaToArc = direction === 'sepolia-to-arc';
        const sourceChainId = isSepoliaToArc ? SEPOLIA_CHAIN_ID : ARC_CHAIN_ID;
        const destinationChainId = isSepoliaToArc ? ARC_CHAIN_ID : SEPOLIA_CHAIN_ID;

        const sourceChainStr = BRIDGE_CHAIN_IDS[sourceChainId];
        const destChainStr = BRIDGE_CHAIN_IDS[destinationChainId];

        // Gerekirse zincir değiştir
        const currentChainHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(currentChainHex, 16);
        if (currentChainId !== sourceChainId) {
          await switchToChain(sourceChainId);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Browser wallet adapter'ı user-controlled modunda oluştur
        const adapter = await createAdapterFromProvider({
          provider: window.ethereum,
          capabilities: {
            addressContext: 'user-controlled',
          },
        });

        console.log(`🌉 Bridging ${amount} ${token}: ${sourceChainStr} → ${destChainStr}`);

        setState(prev => ({ ...prev, step: 'approving' }));

        const result = await kit.bridge({
          from: { adapter, chain: sourceChainStr },
          to:   { adapter, chain: destChainStr },
          amount,
          config: { transferSpeed: 'SLOW' },
        });

        // Event listener'ları temizle
        try { kit.off('approve', onApprove); } catch (_) {}
        try { kit.off('burn', onBurn); } catch (_) {}
        try { kit.off('fetchAttestation', onFetchAttestation); } catch (_) {}

        console.log('✅ Bridge result:', result);

        // Doğru step isimlerine göre hash'leri al
        const sourceTxHash = result?.steps?.find(s => s.name === 'depositForBurn')?.txHash;
        const receiveTxHash = result?.steps?.find(s => s.name === 'mint')?.txHash;

        // Soft error kontrolü (result.state === 'error' ise)
        if (result?.state === 'error') {
          const failedStep = result.steps?.find(s => s.state === 'error');
          throw new Error(failedStep?.error?.message || 'Bridge transaction failed');
        }

        window.__bridgeInProgress = false;
        setState({
          step: 'success',
          error: null,
          result,
          isLoading: false,
          sourceTxHash,
          receiveTxHash,
          direction,
        });

        console.log('🎉 Bridge successful!');

        setTimeout(async () => {
          await fetchTokenBalance(token, sourceChainId);
        }, 3000);

      } catch (err) {
        window.__bridgeInProgress = false;
        console.error('❌ Bridge error:', err);

        let errorMessage = err.message || 'Bridge transaction failed';
        if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || err.code === 4001) {
          errorMessage = 'Transaction rejected in wallet';
        } else if (errorMessage.includes('Insufficient gas') || errorMessage.includes('gas funds')) {
          errorMessage = 'Insufficient gas. Make sure you have ETH on Sepolia or USDC on Arc Testnet to cover transaction fees.';
        } else if (errorMessage.includes('Insufficient funds') || errorMessage.includes('insufficient')) {
          errorMessage = 'Insufficient USDC balance for bridge transaction';
        } else if (errorMessage.includes('not supported') || errorMessage.includes('Route not found')) {
          errorMessage = 'This bridge route is not supported. Make sure both chains are configured correctly.';
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        setState({ step: 'error', error: errorMessage, result: null, isLoading: false });
      }
    },
    [address, isConnected, switchToChain, fetchTokenBalance]
  );

  return { state, tokenBalance, isLoadingBalance, balanceError, fetchTokenBalance, bridge, reset };
}
