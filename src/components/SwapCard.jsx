import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDown, ChevronDown, RefreshCw, Zap, Settings } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePoints } from '../context/PointsContext';
import { useLang } from '../context/LangContext';
import { checkPermit2Allowance, approvePermit2, buildPermitSignature } from '../utils/permit2';
import { executeSwapEdge } from '../utils/backend';
import { parseUnits } from 'ethers';
import NotificationModal from './NotificationModal';

// ─── Sabitler ────────────────────────────────────────────────────────────────
const TOKENS = {
    USDC: {
        address: '0x3600000000000000000000000000000000000000',
        decimals: 6,
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
    EURC: {
        address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
        decimals: 6,
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ctext x='50' y='74' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3E€%3C/text%3E%3C/svg%3E",
    },
};

const RATE_USDC_TO_EURC = 0.9525;
const SLIPPAGE_OPTIONS  = ['0.1', '0.5', '1.0'];
const PERCENT_OPTIONS   = [0.25, 0.5, 0.75, 1];

// ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────
function calcRate(flipped) {
    return flipped ? 1 / RATE_USDC_TO_EURC : RATE_USDC_TO_EURC;
}

function calcMinOut(amount, rate, slippage) {
    if (!amount || isNaN(parseFloat(amount))) return null;
    return (parseFloat(amount) * rate * (1 - parseFloat(slippage) / 100)).toFixed(4);
}

function fireSuccess() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
    import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
        confetti({
            particleCount: 160,
            spread: 150,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'],
            zIndex: 9999,
        });
    });
}

// ─── TokenDropdown ───────────────────────────────────────────────────────────
function TokenDropdown({ open, onClose, activeToken, inactiveToken, balances, onFlip }) {
    if (!open) return null;
    const rows = [
        { symbol: activeToken,   active: true  },
        { symbol: inactiveToken, active: false },
    ];
    return (
        <div className="dropdown-menu" style={{ minWidth: 200 }}>
            {rows.map(({ symbol, active }) => (
                <div
                    key={symbol}
                    className={`dropdown-item${active ? ' active' : ''}`}
                    onClick={() => { onClose(); if (!active) onFlip(); }}
                >
                    <div className="flex items-center gap-1">
                        <img src={TOKENS[symbol].icon} alt={symbol} width={20} height={20} style={{ borderRadius: '50%' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{symbol}</span>
                    </div>
                    <span className="font-mono text-xs text-muted">
                        {parseFloat(balances[symbol] || '0').toFixed(2)}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────
export default function SwapCard({ onActivityAdd }) {
    const { isConnected, balances, setBalances, signer, setIsModalOpen, refreshBalances } = useWallet();
    const { addVolumePoints } = usePoints();
    const { tr } = useLang();

    const [flipped,      setFlipped]      = useState(false);
    const [fromAmount,   setFromAmount]   = useState('');
    const [toAmount,     setToAmount]     = useState('');
    const [slippage,     setSlippage]     = useState('0.5');
    const [isApproved,   setIsApproved]   = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [statusText,   setStatusText]   = useState('');
    const [progress,     setProgress]     = useState(0);
    const [fromDropOpen, setFromDropOpen] = useState(false);
    const [toDropOpen,   setToDropOpen]   = useState(false);
    const [notify,       setNotify]       = useState({ open: false, title: '', message: '', onConfirm: null });

    const fromToken = flipped ? 'EURC' : 'USDC';
    const toToken   = flipped ? 'USDC' : 'EURC';
    const fromBal   = balances[fromToken] || '0';
    const toBal     = balances[toToken]   || '0';
    const rate      = calcRate(flipped);
    const minOut    = calcMinOut(fromAmount, rate, slippage);

    const showNotify = useCallback((title, message, onConfirm = null) => {
        setNotify({ open: true, title, message, onConfirm });
    }, []);

    // Permit2 allowance kontrolü
    useEffect(() => {
        if (!isConnected || !signer) return;
        checkPermit2Allowance(signer, TOKENS[fromToken].address)
            .then(setIsApproved)
            .catch(console.error);
    }, [isConnected, signer, fromToken]);

    // ── Miktar değişimi ──
    const handleAmountChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setFromAmount(val);
            setToAmount(val ? (parseFloat(val) * rate).toFixed(4) : '');
        }
    };

    // ── Yüzde kısayolları ──
    const handlePercent = (pct) => {
        const amt = (parseFloat(fromBal) * pct).toFixed(2);
        setFromAmount(amt);
        setToAmount((parseFloat(amt) * rate).toFixed(4));
    };

    // ── Token ters çevirme ──
    const handleFlip = () => {
        setFlipped(f => !f);
        setFromAmount('');
        setToAmount('');
        setFromDropOpen(false);
        setToDropOpen(false);
    };

    // ── Tek seferlik Permit2 onayı ──
    const handleSetup = useCallback(async () => {
        try {
            setLoading(true);
            setStatusText('Approving Permit2...');
            await approvePermit2(signer, TOKENS[fromToken].address);
            setIsApproved(true);
            showNotify('Success', 'Wallet setup complete! You can now swap.');
        } catch {
            showNotify('Error', 'Failed to setup wallet.');
        } finally {
            setLoading(false);
            setStatusText('');
        }
    }, [signer, fromToken, showNotify]);

    // ── Swap işlemi ──
    const handleSwap = async () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) return;
        if (parseFloat(fromAmount) > parseFloat(fromBal)) {
            showNotify('Insufficient Balance', `You don't have enough ${fromToken}.`);
            return;
        }

        const tokenAddr = TOKENS[fromToken].address;
        const amountRaw = parseUnits(fromAmount, TOKENS[fromToken].decimals);

        // Allowance tekrar kontrol
        try {
            const ok = await checkPermit2Allowance(signer, tokenAddr, amountRaw);
            if (!ok) {
                showNotify('Allowance Required', 'Your allowance is less than the swap amount. Increase it?', handleSetup);
                return;
            }
        } catch (e) { console.error(e); }

        try {
            setLoading(true);
            setProgress(10);
            setStatusText('Getting signature...');

            const nonce    = Math.floor(Math.random() * 1_000_000);
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const { signature, permitData } = await buildPermitSignature(signer, tokenAddr, amountRaw, nonce, deadline);

            setProgress(50);
            setStatusText('Executing swap...');

            const userAddr = await signer.getAddress();
            const result   = await executeSwapEdge(fromAmount, signature, permitData, flipped, userAddr);

            setProgress(100);
            setStatusText('Success!');

            setTimeout(() => {
                setBalances(prev => ({
                    ...prev,
                    [fromToken]: (parseFloat(fromBal) - parseFloat(fromAmount)).toFixed(6),
                    [toToken]:   (parseFloat(toBal)   + parseFloat(toAmount)).toFixed(6),
                }));
                addVolumePoints(fromAmount, fromToken, toToken);
                onActivityAdd({
                    pair:      `${fromToken} → ${toToken}`,
                    amount:    `${fromAmount} ${fromToken}`,
                    status:    'confirmed',
                    timestamp: Date.now(),
                    txHash:    result.txHash,
                });
                setFromAmount('');
                setToAmount('');
                setProgress(0);
                setStatusText('');
                fireSuccess();
            }, 1000);

        } catch (err) {
            console.error(err);
            showNotify('Swap Failed', err.message || err.reason || 'An unexpected error occurred.');
            setProgress(0);
            setStatusText('');
        } finally {
            if (!statusText.includes('Success')) setLoading(false);
            else setTimeout(() => setLoading(false), 1200);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="swap-wrapper mb-4">
            <div className="swap-box">

                {/* Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div className="flex gap-1">
                        <span className="pill pill-silver" style={{ fontSize: '0.72rem' }}>Arc Testnet</span>
                        <span className="pill" style={{ fontSize: '0.72rem' }}>Gas: USDC</span>
                    </div>
                    <button
                        onClick={refreshBalances}
                        className="btn btn-ghost btn-icon"
                        title="Refresh balances"
                        style={{ width: 32, height: 32 }}
                    >
                        <RefreshCw size={13} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                {/* FROM */}
                <div className="swap-input-panel">
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.55rem' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{tr('youPay')}</span>
                        <span className="font-mono text-xs text-muted">
                            {tr('balance')} {parseFloat(fromBal).toFixed(2)} {fromToken}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={fromAmount}
                            onChange={handleAmountChange}
                            disabled={loading}
                            className="swap-amount-input"
                        />
                        <div style={{ position: 'relative' }}>
                            <div className="token-badge" onClick={() => !loading && setFromDropOpen(o => !o)}>
                                <img src={TOKENS[fromToken].icon} alt={fromToken} width={18} height={18} style={{ borderRadius: '50%' }} />
                                {fromToken} <ChevronDown size={13} />
                            </div>
                            <TokenDropdown
                                open={fromDropOpen}
                                onClose={() => setFromDropOpen(false)}
                                activeToken={fromToken}
                                inactiveToken={toToken}
                                balances={balances}
                                onFlip={handleFlip}
                            />
                        </div>
                    </div>
                    <div className="percent-strip">
                        {PERCENT_OPTIONS.map(p => (
                            <button key={p} className="percent-chip" onClick={() => handlePercent(p)} disabled={loading}>
                                {p * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Flip */}
                <button className="swap-flip-btn" onClick={handleFlip} disabled={loading}>
                    <ArrowDown size={16} className={loading && progress > 0 ? 'spin' : ''} />
                </button>

                {/* TO */}
                <div className="swap-input-panel">
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.55rem' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{tr('youReceive')}</span>
                        <span className="font-mono text-xs text-muted">
                            {tr('balance')} {parseFloat(toBal).toFixed(2)} {toToken}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={toAmount}
                            readOnly
                            className="swap-amount-input"
                            style={{ opacity: 0.55 }}
                        />
                        <div style={{ position: 'relative' }}>
                            <div className="token-badge" onClick={() => !loading && setToDropOpen(o => !o)}>
                                <img src={TOKENS[toToken].icon} alt={toToken} width={18} height={18} style={{ borderRadius: '50%' }} />
                                {toToken} <ChevronDown size={13} />
                            </div>
                            <TokenDropdown
                                open={toDropOpen}
                                onClose={() => setToDropOpen(false)}
                                activeToken={toToken}
                                inactiveToken={fromToken}
                                balances={balances}
                                onFlip={handleFlip}
                            />
                        </div>
                    </div>
                </div>

                {/* Rate bar */}
                <div className="rate-bar">
                    <span>{tr('exchangeRate')}</span>
                    <span>1 {fromToken} = {rate.toFixed(4)} {toToken}</span>
                </div>

                {/* Slippage */}
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <Settings size={11} /> Slippage
                        </span>
                        {minOut && (
                            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Min: {minOut} {toToken}
                            </span>
                        )}
                    </div>
                    <div className="percent-strip">
                        {SLIPPAGE_OPTIONS.map(s => (
                            <button
                                key={s}
                                className="percent-chip"
                                onClick={() => setSlippage(s)}
                                disabled={loading}
                                style={{
                                    borderColor: slippage === s ? 'var(--border-silver)' : undefined,
                                    color:       slippage === s ? 'var(--text-primary)'  : undefined,
                                    background:  slippage === s ? 'var(--bg-card-hover)' : undefined,
                                }}
                            >
                                {s}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Progress bar */}
                {loading && progress > 0 && (
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* Action button */}
                <div style={{ marginTop: '1rem' }}>
                    {!isConnected ? (
                        <button
                            className="btn btn-silver w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {tr('connectToSwap')}
                        </button>
                    ) : !isApproved ? (
                        <button
                            className="btn btn-primary w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={handleSetup}
                            disabled={loading}
                        >
                            {loading ? statusText : tr('setupWallet')}
                        </button>
                    ) : (
                        <button
                            className="btn btn-success w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={handleSwap}
                            disabled={loading || !fromAmount}
                        >
                            <Zap size={16} />
                            {loading ? statusText : tr('oneClickSwap')}
                        </button>
                    )}
                </div>
            </div>

            <NotificationModal
                isOpen={notify.open}
                onClose={() => setNotify(n => ({ ...n, open: false }))}
                title={notify.title}
                message={notify.message}
                onConfirm={notify.onConfirm}
                confirmText={notify.onConfirm ? tr('approve') : 'OK'}
                cancelText={tr('cancel')}
            />
        </div>
    );
}
