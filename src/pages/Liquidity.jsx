import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { Plus, Minus, Info, Droplets } from 'lucide-react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import NotificationModal from '../components/NotificationModal';
import ActivityFeed from '../components/ActivityFeed';

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const EURC_ADDR = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const ESCROW_ADDR = "0xf11aA9A07f6fe684BC0495aDAc8797137dd2e7eF";

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)"
];

const ESCROW_ABI = [
    "function depositLiquidity(address token, uint256 amount) external",
    "function withdrawLiquidity(address token, uint256 amount) external",
    "function lpBalances(address user, address token) public view returns (uint256)"
];

export default function Liquidity() {
    const { isConnected, address, signer, refreshBalances, setIsModalOpen, balances } = useWallet();
    const { tr } = useLang();
    const [token, setToken] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [lpBalance, setLpBalance] = useState('0');
    const [loading, setLoading] = useState(false);
    const [poolInfo, setPoolInfo] = useState({ usdc: '0', eurc: '0' });
    const [notification, setNotification] = useState({ open: false, title: '', message: '' });
    const [activities, setActivities] = useState([]);

    const showNotify = (title, message) => setNotification({ open: true, title, message });

    useEffect(() => {
        fetchPoolInfo();
        if (isConnected && address && signer) {
            fetchLpBalance();
            loadActivities();
        } else {
            setActivities([]);
            setLpBalance('0');
        }
    }, [isConnected, address, token]);

    const loadActivities = () => {
        const key = `arc_lp_activities_${address.toLowerCase()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try { setActivities(JSON.parse(saved)); } catch { setActivities([]); }
        }
    };

    const handleActivityAdd = act => {
        if (!address) return;
        setActivities(prev => {
            const next = [act, ...prev];
            localStorage.setItem(`arc_lp_activities_${address.toLowerCase()}`,
                JSON.stringify(next, (k, v) => typeof v === 'bigint' ? v.toString() : v));
            return next;
        });
    };

    const fetchLpBalance = async () => {
        try {
            const contract = new Contract(ESCROW_ADDR, ESCROW_ABI, signer);
            const tokenAddr = token === 'USDC' ? USDC_ADDR : EURC_ADDR;
            const balance = await contract.lpBalances(address, tokenAddr);
            setLpBalance(formatUnits(balance, 6));
        } catch (err) { console.error("Fetch LP Error:", err); }
    };

    const fetchPoolInfo = async () => {
        try {
            const { JsonRpcProvider, Contract } = await import('ethers');
            const provider = new JsonRpcProvider("https://rpc.testnet.arc.network");
            const usdc = new Contract(USDC_ADDR, ERC20_ABI, provider);
            const eurc = new Contract(EURC_ADDR, ERC20_ABI, provider);
            const uBal = await usdc.balanceOf(ESCROW_ADDR);
            const eBal = await eurc.balanceOf(ESCROW_ADDR);
            setPoolInfo({ usdc: formatUnits(uBal, 6), eurc: formatUnits(eBal, 6) });
        } catch (err) { console.error("Pool info error:", err); }
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (!signer) { showNotify("Not Connected", "Please connect your wallet first."); return; }
        setLoading(true);
        try {
            const tokenAddr = token === 'USDC' ? USDC_ADDR : EURC_ADDR;
            const tokenContract = new Contract(tokenAddr, ERC20_ABI, signer);
            const amountRaw = parseUnits(amount, 6);
            const userBalRaw = await tokenContract.balanceOf(address);
            if (userBalRaw < amountRaw) throw new Error("Insufficient balance.");
            const allowance = await tokenContract.allowance(address, ESCROW_ADDR);
            if (allowance < amountRaw) {
                const txApp = await tokenContract.approve(ESCROW_ADDR, amountRaw);
                await txApp.wait();
            }
            const escrow = new Contract(ESCROW_ADDR, ESCROW_ABI, signer);
            const tx = await escrow.depositLiquidity(tokenAddr, amountRaw);
            handleActivityAdd({ pair: `Deposit ${token}`, amount: `${amount} ${token}`, status: 'pending', timestamp: Date.now(), txHash: tx.hash });
            await tx.wait();
            setActivities(prev => prev.map(a => a.txHash === tx.hash ? { ...a, status: 'confirmed' } : a));
            showNotify("Success", "Liquidity added successfully!");
            setAmount('');
            fetchLpBalance();
            fetchPoolInfo();
            refreshBalances();
        } catch (err) {
            showNotify("Deposit Failed", err.reason || err.message || "Unknown error.");
        } finally { setLoading(false); }
    };

    const handleWithdraw = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (!signer) { showNotify("Not Connected", "Please connect your wallet first."); return; }
        setLoading(true);
        try {
            const tokenAddr = token === 'USDC' ? USDC_ADDR : EURC_ADDR;
            const escrow = new Contract(ESCROW_ADDR, ESCROW_ABI, signer);
            const tx = await escrow.withdrawLiquidity(tokenAddr, parseUnits(amount, 6));
            handleActivityAdd({ pair: `Withdraw ${token}`, amount: `${amount} ${token}`, status: 'pending', timestamp: Date.now(), txHash: tx.hash });
            await tx.wait();
            setActivities(prev => prev.map(a => a.txHash === tx.hash ? { ...a, status: 'confirmed' } : a));
            showNotify("Success", "Liquidity withdrawn successfully!");
            setAmount('');
            fetchLpBalance();
            fetchPoolInfo();
            refreshBalances();
        } catch (err) {
            showNotify("Withdraw Failed", err.reason || err.message || "Unknown error.");
        } finally { setLoading(false); }
    };

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: 860, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-live">
                        <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                        Live
                    </span>
                    <span className="status-badge status-badge-info">Liquidity Pool</span>
                </div>
                <h1 className="page-title">
                    <span className="silver-text">{tr('poolTitle')}</span>
                </h1>
                <p className="page-subtitle">{tr('poolSubtitle')}</p>
            </div>

            <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                <div className="flex items-center gap-1">
                    <Info size={16} color="var(--accent-green)" />
                    <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{tr('liquidityProvision')}</strong> {tr('poolInfoBanner')}
                    </p>
                </div>
            </div>

            <div className="grid-2">
                {/* Stats */}
                <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <div className="flex items-center gap-1 mb-3">
                        <Droplets size={20} color="var(--accent-green)" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{tr('globalPool')}</h2>
                    </div>
                    <p className="font-mono text-xs text-muted" style={{ marginBottom: '1.25rem', lineHeight: 1.7 }}>
                        {tr('totalLiquidity')}
                    </p>

                    <div className="flex-col gap-1">
                        {[
                            { label: 'USDC Depth', value: `${parseFloat(poolInfo.usdc).toLocaleString()} USDC`, color: '#3b82f6' },
                            { label: 'EURC Depth', value: `${parseFloat(poolInfo.eurc).toLocaleString()} EURC`, color: '#10b981' },
                        ].map((s, i) => (
                            <div key={i} className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.3rem' }}>{s.label}</div>
                                <div className="stat-value" style={{ fontSize: '1.4rem', color: s.color }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 mt-3" style={{ padding: '0.875rem', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <Info size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                            {tr('lowPoolDepth')}
                        </p>
                    </div>
                </div>

                {/* Manage */}
                <div className="glass-card-elevated" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{tr('manageAssets')}</h2>

                    <div className="flex gap-1 mb-3">
                        {['USDC', 'EURC'].map(t => (
                            <button key={t} onClick={() => setToken(t)}
                                className={`btn w-full ${token === t ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '0.55rem', fontSize: '0.875rem' }}
                            >{t}</button>
                        ))}
                    </div>

                    <div className="swap-input-panel mt-2">
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <span className="text-xs font-mono text-muted">{tr('amountLabel')}</span>
                            <div className="text-right">
                                <div className="font-mono text-xs text-muted">{tr('walletLabel')} {parseFloat(balances[token] || 0).toFixed(2)}</div>
                                <div className="font-mono text-xs text-muted">{tr('depositedLabel')} {parseFloat(lpBalance).toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <input type="text" placeholder="0.00" value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="swap-amount-input" style={{ fontSize: '1.5rem' }}
                            />
                            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{token}</span>
                        </div>
                    </div>

                    <div style={{ margin: '1.25rem 0.25rem' }}>
                        <input type="range" min="0" max="100"
                            value={!amount ? 0 : Math.min(100, (parseFloat(amount) / (parseFloat(balances[token]) || 1) * 100))}
                            onChange={e => {
                                const pct = parseFloat(e.target.value);
                                setAmount(((pct / 100) * (parseFloat(balances[token]) || 0)).toFixed(2));
                            }}
                            style={{ width: '100%', accentColor: 'var(--accent-violet)', cursor: 'pointer' }}
                        />
                        <div className="flex justify-between mt-1">
                            {[0, 25, 50, 75, 100].map(p => (
                                <button key={p} className="percent-chip"
                                    style={{ flex: 'none', padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                    onClick={() => setAmount(((p / 100) * (parseFloat(balances[token]) || 0)).toFixed(2))}
                                >{p}%</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-1 mt-3">
                        <button className="btn btn-success w-full" onClick={handleDeposit} disabled={loading || !isConnected}>
                            <Plus size={17} className={loading ? 'spin' : ''} />
                            {loading ? tr('processing') : tr('deposit')}
                        </button>
                        <button className="btn btn-danger w-full" onClick={handleWithdraw} disabled={loading || !isConnected}>
                            <Minus size={17} className={loading ? 'spin' : ''} />
                            {loading ? tr('processing') : tr('withdraw')}
                        </button>
                    </div>

                    {!isConnected && (
                        <div className="text-center mt-3">
                            <p className="text-sm font-mono" style={{ color: 'var(--accent-red)', marginBottom: '0.75rem' }}>
                                {tr('connectToManage')}
                            </p>
                            <button className="btn btn-primary w-full" onClick={() => setIsModalOpen(true)}>
                                {tr('connectWallet')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <NotificationModal
                isOpen={notification.open}
                onClose={() => setNotification({ ...notification, open: false })}
                title={notification.title}
                message={notification.message}
                confirmText="OK"
            />
            <ActivityFeed activities={activities} />
        </div>
    );
}
