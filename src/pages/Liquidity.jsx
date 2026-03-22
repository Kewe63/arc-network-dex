import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { Plus, Minus, ArrowDownCircle, ArrowUpCircle, Droplets, TrendingUp, Wallet } from 'lucide-react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import NotificationModal from '../components/NotificationModal';
import ActivityFeed from '../components/ActivityFeed';

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const EURC_ADDR = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const ESCROW_ADDR = "0xd01d109f0a31A12E6eDF2c079B05Ea09E3FBA189";

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

const TOKENS = {
    USDC: { address: USDC_ADDR, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    EURC: { address: EURC_ADDR, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
};

export default function Liquidity() {
    const { isConnected, address, signer, refreshBalances, setIsModalOpen, balances } = useWallet();
    const { tr } = useLang();
    const [token, setToken] = useState('USDC');
    const [tab, setTab] = useState('deposit'); // 'deposit' | 'withdraw'
    const [amount, setAmount] = useState('');
    const [lpBalances, setLpBalances] = useState({ USDC: '0', EURC: '0' });
    const [loading, setLoading] = useState(false);
    const [poolInfo, setPoolInfo] = useState({ usdc: '0', eurc: '0' });
    const [notification, setNotification] = useState({ open: false, title: '', message: '' });
    const [activities, setActivities] = useState([]);

    const showNotify = (title, message) => setNotification({ open: true, title, message });
    const tokenAddr = TOKENS[token].address;
    const walletBal = parseFloat(balances[token] || 0);
    const depositedBal = parseFloat(tab === 'deposit' ? lpBalances[token] : lpBalances[token]);
    const maxAmount = tab === 'deposit' ? walletBal : parseFloat(lpBalances[token]);

    useEffect(() => {
        fetchPoolInfo();
        if (isConnected && address && signer) {
            fetchLpBalances();
            loadActivities();
        } else {
            setActivities([]);
            setLpBalances({ USDC: '0', EURC: '0' });
        }
    }, [isConnected, address]);

    useEffect(() => { setAmount(''); }, [token, tab]);

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

    const fetchLpBalances = async () => {
        try {
            const contract = new Contract(ESCROW_ADDR, ESCROW_ABI, signer);
            const [uBal, eBal] = await Promise.all([
                contract.lpBalances(address, USDC_ADDR),
                contract.lpBalances(address, EURC_ADDR),
            ]);
            setLpBalances({ USDC: formatUnits(uBal, 6), EURC: formatUnits(eBal, 6) });
        } catch (err) { console.error("Fetch LP Error:", err); }
    };

    const fetchPoolInfo = async () => {
        try {
            const { JsonRpcProvider, Contract } = await import('ethers');
            const provider = new JsonRpcProvider("https://rpc.testnet.arc.network");
            const usdc = new Contract(USDC_ADDR, ERC20_ABI, provider);
            const eurc = new Contract(EURC_ADDR, ERC20_ABI, provider);
            const [uBal, eBal] = await Promise.all([usdc.balanceOf(ESCROW_ADDR), eurc.balanceOf(ESCROW_ADDR)]);
            setPoolInfo({ usdc: formatUnits(uBal, 6), eurc: formatUnits(eBal, 6) });
        } catch (err) { console.error("Pool info error:", err); }
    };

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (!signer) { showNotify("Not Connected", "Please connect your wallet first."); return; }
        setLoading(true);
        try {
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
            fetchLpBalances();
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
            const escrow = new Contract(ESCROW_ADDR, ESCROW_ABI, signer);
            const tx = await escrow.withdrawLiquidity(tokenAddr, parseUnits(amount, 6));
            handleActivityAdd({ pair: `Withdraw ${token}`, amount: `${amount} ${token}`, status: 'pending', timestamp: Date.now(), txHash: tx.hash });
            await tx.wait();
            setActivities(prev => prev.map(a => a.txHash === tx.hash ? { ...a, status: 'confirmed' } : a));
            showNotify("Success", "Liquidity withdrawn successfully!");
            setAmount('');
            fetchLpBalances();
            fetchPoolInfo();
            refreshBalances();
        } catch (err) {
            showNotify("Withdraw Failed", err.reason || err.message || "Unknown error.");
        } finally { setLoading(false); }
    };

    const totalPool = parseFloat(poolInfo.usdc) + parseFloat(poolInfo.eurc);
    const usdcPct = totalPool > 0 ? (parseFloat(poolInfo.usdc) / totalPool * 100) : 50;
    const eurcPct = 100 - usdcPct;
    const totalDeposited = parseFloat(lpBalances.USDC) + parseFloat(lpBalances.EURC);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem 4rem' }}>
            {/* Header */}
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

            {/* Pool Stats — top bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { icon: <Droplets size={18} />, label: 'Total Pool Depth', value: `$${parseFloat(totalPool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#a78bfa' },
                    { icon: <TrendingUp size={18} />, label: 'USDC in Pool', value: `${parseFloat(poolInfo.usdc).toLocaleString()} USDC`, color: '#3b82f6' },
                    { icon: <TrendingUp size={18} />, label: 'EURC in Pool', value: `${parseFloat(poolInfo.eurc).toLocaleString()} EURC`, color: '#10b981' },
                ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                        <div className="flex items-center gap-1" style={{ color: s.color, marginBottom: '0.5rem' }}>
                            {s.icon}
                            <span className="font-mono text-xs text-muted">{s.label}</span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Pool ratio bar */}
            <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <span className="font-mono text-xs text-muted">Pool Ratio</span>
                    <span className="font-mono text-xs text-muted">USDC {usdcPct.toFixed(1)}% / EURC {eurcPct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-card)', display: 'flex' }}>
                    <div style={{ width: `${usdcPct}%`, background: '#3b82f6', transition: 'width 0.6s ease' }} />
                    <div style={{ width: `${eurcPct}%`, background: '#10b981', transition: 'width 0.6s ease' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.25rem' }}>
                {/* My Position */}
                <div className="glass-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
                    <div className="flex items-center gap-1" style={{ marginBottom: '1.25rem' }}>
                        <Wallet size={18} color="var(--accent-violet)" />
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>My Position</h2>
                    </div>

                    {isConnected ? (
                        <>
                            <div style={{ marginBottom: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: TOKENS.USDC.bg, border: `1px solid ${TOKENS.USDC.border}` }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.3rem' }}>USDC Deposited</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: TOKENS.USDC.color }}>{parseFloat(lpBalances.USDC).toFixed(2)}</div>
                            </div>
                            <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: TOKENS.EURC.bg, border: `1px solid ${TOKENS.EURC.border}` }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.3rem' }}>EURC Deposited</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: TOKENS.EURC.color }}>{parseFloat(lpBalances.EURC).toFixed(2)}</div>
                            </div>
                            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                <div className="flex justify-between">
                                    <span className="font-mono text-xs text-muted">Total Value</span>
                                    <span className="font-mono text-xs" style={{ fontWeight: 700 }}>${totalDeposited.toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <p className="text-sm font-mono text-muted" style={{ marginBottom: '1rem' }}>Connect wallet to see your position</p>
                            <button className="btn btn-primary w-full" onClick={() => setIsModalOpen(true)}>
                                {tr('connectWallet')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Manage Panel */}
                <div className="glass-card-elevated" style={{ padding: '1.5rem' }}>
                    {/* Tab switcher */}
                    <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: '1.5rem' }}>
                        {[
                            { key: 'deposit', label: 'Deposit', icon: <ArrowDownCircle size={15} /> },
                            { key: 'withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={15} /> },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                style={{
                                    flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                                    borderRadius: 'var(--radius-sm)',
                                    background: tab === t.key ? (t.key === 'deposit' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'transparent',
                                    color: tab === t.key ? (t.key === 'deposit' ? '#10b981' : '#ef4444') : 'var(--text-muted)',
                                    fontWeight: tab === t.key ? 700 : 400,
                                    fontSize: '0.875rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Token selector */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {['USDC', 'EURC'].map(t => (
                            <button
                                key={t}
                                onClick={() => setToken(t)}
                                style={{
                                    flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    border: `1px solid ${token === t ? TOKENS[t].border : 'var(--border-subtle)'}`,
                                    background: token === t ? TOKENS[t].bg : 'transparent',
                                    color: token === t ? TOKENS[t].color : 'var(--text-muted)',
                                    fontWeight: token === t ? 700 : 400,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Amount input */}
                    <div className="swap-input-panel" style={{ marginBottom: '1rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                            <span className="font-mono text-xs text-muted">Amount</span>
                            <div style={{ textAlign: 'right' }}>
                                <div className="font-mono text-xs text-muted">
                                    {tab === 'deposit' ? `Wallet: ${walletBal.toFixed(2)}` : `Deposited: ${parseFloat(lpBalances[token]).toFixed(2)}`} {token}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="swap-amount-input"
                                style={{ fontSize: '1.6rem' }}
                                disabled={loading || !isConnected}
                            />
                            <span style={{ fontWeight: 700, color: TOKENS[token].color, flexShrink: 0, fontSize: '1rem' }}>{token}</span>
                        </div>
                    </div>

                    {/* Percent chips */}
                    <div className="percent-strip" style={{ marginBottom: '1.25rem' }}>
                        {[25, 50, 75, 100].map(p => (
                            <button
                                key={p}
                                className="percent-chip"
                                disabled={loading || !isConnected}
                                onClick={() => setAmount(((p / 100) * maxAmount).toFixed(2))}
                            >
                                {p === 100 ? 'MAX' : `${p}%`}
                            </button>
                        ))}
                    </div>

                    {/* Action button */}
                    {isConnected ? (
                        <button
                            className={`btn w-full ${tab === 'deposit' ? 'btn-success' : 'btn-danger'}`}
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={tab === 'deposit' ? handleDeposit : handleWithdraw}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                        >
                            {tab === 'deposit'
                                ? <><Plus size={16} className={loading ? 'spin' : ''} /> {loading ? tr('processing') : tr('deposit')}</>
                                : <><Minus size={16} className={loading ? 'spin' : ''} /> {loading ? tr('processing') : tr('withdraw')}</>
                            }
                        </button>
                    ) : (
                        <button className="btn btn-primary w-full" style={{ padding: '0.9rem' }} onClick={() => setIsModalOpen(true)}>
                            {tr('connectWallet')}
                        </button>
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
