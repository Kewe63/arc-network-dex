import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, formatUnits } from 'ethers';
import { ensureArcNetwork } from '../utils/network';
import { usePoints } from './PointsContext';

const WalletContext = createContext();
export const useWallet = () => useContext(WalletContext);

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const EURC_ADDR = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

export const WalletProvider = ({ children }) => {
    const { initPoints } = usePoints();
    const [address, setAddress] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [balances, setBalances] = useState({ USDC: "0.00", EURC: "0.00" });
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('arc-dex-theme') || 'dark';
        setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('arc-dex-theme', next);
    };

    const connectWallet = async (type = 'metamask') => {
        try {
            if (type === 'metamask' && window.ethereum) {
                const ethersProvider = new BrowserProvider(window.ethereum);
                const accounts = await ethersProvider.send("eth_requestAccounts", []);
                await ensureArcNetwork();
                const ethersSigner = await ethersProvider.getSigner();

                setProvider(ethersProvider);
                setSigner(ethersSigner);
                setAddress(accounts[0]);
                setIsConnected(true);
                setIsModalOpen(false);
                fetchBalances(ethersSigner, accounts[0]);
                initPoints(accounts[0]);

                window.ethereum.on('accountsChanged', (newAccounts) => {
                    if (newAccounts.length === 0) disconnect();
                    else {
                        setAddress(newAccounts[0]);
                        fetchBalances(ethersSigner, newAccounts[0]);
                        initPoints(newAccounts[0]);
                    }
                });

                window.ethereum.on('chainChanged', () => window.location.reload());
            } else {
                alert("WalletConnect not fully implemented in this demo.");
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
        setBalances({ USDC: "0", EURC: "0" });
        initPoints(null);
    };

    const fetchBalances = async (currentSigner, currentAddress) => {
        if (!currentSigner || !currentAddress) return;
        try {
            const { Contract } = await import('ethers');
            const usdc = new Contract(USDC_ADDR, ERC20_ABI, currentSigner);
            const eurc = new Contract(EURC_ADDR, ERC20_ABI, currentSigner);
            const usdcRaw = await usdc.balanceOf(currentAddress);
            const eurcRaw = await eurc.balanceOf(currentAddress);
            setBalances({
                USDC: formatUnits(usdcRaw, 6),
                EURC: formatUnits(eurcRaw, 6)
            });
        } catch (err) {
            console.error("Failed to fetch balances:", err);
        }
    };

    const refreshBalances = () => {
        if (signer && address) fetchBalances(signer, address);
    };

    useEffect(() => {
        let interval;
        if (isConnected && signer && address) {
            interval = setInterval(refreshBalances, 30000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isConnected, signer, address]);

    return (
        <WalletContext.Provider value={{
            address, isConnected, provider, signer,
            theme, toggleTheme, connectWallet, disconnect,
            balances, setBalances, refreshBalances,
            isModalOpen, setIsModalOpen
        }}>
            {children}
        </WalletContext.Provider>
    );
};
