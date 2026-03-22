import React, { useState, useEffect } from 'react';
import { ArrowDown, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { usePoints } from '../context/PointsContext';
import { useLang } from '../context/LangContext';
import { checkPermit2Allowance, approvePermit2, getArcadeSignature } from '../utils/permit2';
import { executeSwapEdge, checkRelayerHealth } from '../utils/backend';
import { parseUnits } from 'ethers';
import NotificationModal from './NotificationModal';

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const EURC_ADDR = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const USDC_EURC_RATE = 0.92;

const USDC_ICON = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png";
const EURC_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ctext x='50' y='74' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3E€%3C/text%3E%3C/svg%3E";

export default function SwapCard({ onActivityAdd }) {
    const { isConnected, balances, setBalances, signer, setIsModalOpen, refreshBalances } = useWallet();
    const { addVolumePoints } = usePoints();
    const { tr } = useLang();
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [progress, setProgress] = useState(0);
    const [notify, setNotify] = useState({ open: false, title: '', message: '', onConfirm: null });
    const [fromDropOpen, setFromDropOpen] = useState(false);
    const [toDropOpen, setToDropOpen] = useState(false);
    const [slippage, setSlippage] = useState('0.5');
    const [relayerOk, setRelayerOk] = useState(null);

    const fromToken = isFlipped ? 'EURC' : 'USDC';
    const toToken = isFlipped ? 'USDC' : 'EURC';
    const fromBalance = balances[fromToken] || '0';
    const toBalance = balances[toToken] || '0';
    const fromIcon = isFlipped ? EURC_ICON : USDC_ICON;
    const toIcon = isFlipped ? USDC_ICON : EURC_ICON;
    const rate = isFlipped ? 1 / USDC_EURC_RATE : USDC_EURC_RATE;
    const minOut = fromAmount ? (parseFloat(fromAmount) * rate * (1 - parseFloat(slippage) / 100)).toFixed(4) : null;

    const showNotify = (title, message, onConfirm = null) =>
        setNotify({ open: true, title, message, onConfirm });

    useEffect(() => {
        if (!isConnected || !signer) return;
        const check = async () => {
            try {
                const tokenAddr = isFlipped ? EURC_ADDR : USDC_ADDR;
                setIsApproved(await checkPermit2Allowance(signer, tokenAddr));
            } catch (e) { console.error(e); }
        };
        check();
    }, [isConnected, signer, isFlipped]);

    useEffect(() => {
        checkRelayerHealth().then(ok => setRelayerOk(ok));
    }, []);

    const handleAmountChange = e => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setFromAmount(val);
            setToAmount(val ? (parseFloat(val) * rate).toFixed(4) : '');
        }
    };

    const setPercent = pct => {
        const amt = (parseFloat(fromBalance) * pct).toFixed(2);
        setFromAmount(amt);
        setToAmount((parseFloat(amt) * rate).toFixed(4));
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        setFromAmount(''); setToAmount('');
        setFromDropOpen(false); setToDropOpen(false);
    };

    const handleSetup = async () => {
        try {
            setLoading(true);
            setStatusText('Approving Permit2...');
            await approvePermit2(signer, isFlipped ? EURC_ADDR : USDC_ADDR);
            setIsApproved(true);
            showNotify("Success", "Wallet setup complete! You can now swap.");
        } catch (err) {
            showNotify("Error", "Failed to setup wallet.");
        } finally { setLoading(false); setStatusText(''); }
    };

    const executeSwap = async () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) return;
        if (parseFloat(fromAmount) > parseFloat(fromBalance)) {
            showNotify("Insufficient Balance", `You don't have enough ${fromToken}.`);
            return;
        }
        const tokenAddr = isFlipped ? EURC_ADDR : USDC_ADDR;
        const amountRaw = parseUnits(fromAmount, 6);
        try {
            const ok = await checkPermit2Allowance(signer, tokenAddr, amountRaw);
            if (!ok) {
                showNotify("Allowance Required", "Your allowance is less than the swap amount. Increase it?", handleSetup);
                return;
            }
        } catch (e) { console.error(e); }

        try {
            setLoading(true); setProgress(10); setStatusText('Getting signature...');
            const nonce = Math.floor(Math.random() * 1000000);
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const { signature, permitData } = await getArcadeSignature(signer, tokenAddr, amountRaw, nonce, deadline);

            setProgress(50); setStatusText('Executing swap...');
            const userAddr = await signer.getAddress();
            const result = await executeSwapEdge(fromAmount, signature, permitData, isFlipped, userAddr);

            setProgress(100); setStatusText('Success!');

            setTimeout(() => {
                setBalances(prev => ({
                    ...prev,
                    [fromToken]: (parseFloat(fromBalance) - parseFloat(fromAmount)).toFixed(6),
                    [toToken]: (parseFloat(toBalance) + parseFloat(toAmount)).toFixed(6),
                }));
                addVolumePoints(fromAmount, fromToken, toToken);
                onActivityAdd({
                    pair: `${fromToken} → ${toToken}`,
                    amount: `${fromAmount} ${fromToken}`,
                    status: 'confirmed',
                    timestamp: Date.now(),
                    txHash: result.txHash
                });
                setFromAmount(''); setToAmount('');
                setProgress(0); setStatusText('');

                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
                audio.volume = 0.4;
                audio.play().catch(() => { });

                import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
                    confetti({
                        particleCount: 160,
                        spread: 150,
                        origin: { y: 0.6 },
                        colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'],
                        zIndex: 9999
                    });
                });
            }, 1000);

        } catch (err) {
            console.error(err);
            showNotify("Swap Failed", err.message || err.reason || "An unexpected error occurred.");
            setProgress(0); setStatusText('');
        } finally {
            if (!statusText.includes('Success')) setLoading(false);
            else setTimeout(() => setLoading(false), 1200);
        }
    };

    const TokenDropdown = ({ open, onClose, activeToken, activeIcon, activeBalance, inactiveToken, inactiveIcon, inactiveBalance, onFlip }) => {
        if (!open) return null;
        return (
            <div className="dropdown-menu" style={{ minWidth: 200 }}>
                <div className="dropdown-item active" onClick={onClose}>
                    <div className="flex items-center gap-1">
                        <img src={activeIcon} alt={activeToken} width={20} height={20} style={{ borderRadius: '50%' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{activeToken}</span>
                    </div>
                    <span className="font-mono text-xs text-muted">{parseFloat(activeBalance).toFixed(2)}</span>
                </div>
                <div className="dropdown-item" onClick={() => { onClose(); onFlip(); }}>
                    <div className="flex items-center gap-1">
                        <img src={inactiveIcon} alt={inactiveToken} width={20} height={20} style={{ borderRadius: '50%' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inactiveToken}</span>
                    </div>
                    <span className="font-mono text-xs text-muted">{parseFloat(inactiveBalance).toFixed(2)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="swap-wrapper mb-4">
            <div className="swap-box">
                {/* Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div className="flex gap-1">
                        <span className="pill pill-silver" style={{ fontSize: '0.72rem' }}>Arc Testnet</span>
                        <span className="pill" style={{ fontSize: '0.72rem' }}>Gas: USDC</span>
                    </div>
                    <button onClick={refreshBalances} className="btn btn-ghost btn-icon"
                        title="Refresh balances" style={{ width: 32, height: 32 }}>
                        <RefreshCw size={13} className={loading ? 'spin' : ''} />
                    </button>
                </div>

                {/* Relayer health uyarısı */}
                {relayerOk === false && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 0.875rem',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        fontSize: '0.78rem', color: '#f87171',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        ⚠ Relayer şu an çevrimdışı görünüyor — swap geçici olarak çalışmayabilir.
                    </div>
                )}

                {/* FROM */}
                <div className="swap-input-panel">
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.55rem' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{tr('youPay')}</span>
                        <span className="font-mono text-xs text-muted">
                            {tr('balance')} {parseFloat(fromBalance).toFixed(2)} {fromToken}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text" placeholder="0.00" value={fromAmount}
                            onChange={handleAmountChange} disabled={loading}
                            className="swap-amount-input"
                        />
                        <div style={{ position: 'relative' }}>
                            <div className="token-badge" onClick={() => !loading && setFromDropOpen(!fromDropOpen)}>
                                <img src={fromIcon} alt={fromToken} width={18} height={18} style={{ borderRadius: '50%' }} />
                                {fromToken} <ChevronDown size={13} />
                            </div>
                            <TokenDropdown
                                open={fromDropOpen} onClose={() => setFromDropOpen(false)}
                                activeToken={fromToken} activeIcon={fromIcon} activeBalance={fromBalance}
                                inactiveToken={toToken} inactiveIcon={toIcon} inactiveBalance={toBalance}
                                onFlip={handleFlip}
                            />
                        </div>
                    </div>
                    <div className="percent-strip">
                        {[0.25, 0.5, 0.75, 1].map(p => (
                            <button key={p} className="percent-chip"
                                onClick={() => setPercent(p)} disabled={loading}>
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
                            {tr('balance')} {parseFloat(toBalance).toFixed(2)} {toToken}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text" placeholder="0.00" value={toAmount}
                            readOnly className="swap-amount-input" style={{ opacity: 0.55 }}
                        />
                        <div style={{ position: 'relative' }}>
                            <div className="token-badge" onClick={() => !loading && setToDropOpen(!toDropOpen)}>
                                <img src={toIcon} alt={toToken} width={18} height={18} style={{ borderRadius: '50%' }} />
                                {toToken} <ChevronDown size={13} />
                            </div>
                            <TokenDropdown
                                open={toDropOpen} onClose={() => setToDropOpen(false)}
                                activeToken={toToken} activeIcon={toIcon} activeBalance={toBalance}
                                inactiveToken={fromToken} inactiveIcon={fromIcon} inactiveBalance={fromBalance}
                                onFlip={handleFlip}
                            />
                        </div>
                    </div>
                </div>

                {/* Rate */}
                <div className="rate-bar">
                    <span>{tr('exchangeRate')}</span>
                    <span>1 {fromToken} = {rate.toFixed(4)} {toToken}</span>
                </div>

                {/* Slippage */}
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Slippage Toleransı
                        </span>
                        {minOut && (
                            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Min. alınacak: {minOut} {toToken}
                            </span>
                        )}
                    </div>
                    <div className="percent-strip">
                        {['0.1', '0.5', '1'].map(s => (
                            <button
                                key={s}
                                className="percent-chip"
                                onClick={() => setSlippage(s)}
                                disabled={loading}
                                style={{
                                    borderColor: slippage === s ? 'var(--border-silver)' : undefined,
                                    color: slippage === s ? 'var(--text-primary)' : undefined,
                                    background: slippage === s ? 'var(--bg-card-hover)' : undefined,
                                }}
                            >
                                {s}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                {loading && progress > 0 && (
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* Action */}
                <div style={{ marginTop: '1rem' }}>
                    {!isConnected ? (
                        <button className="btn btn-silver w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={() => setIsModalOpen(true)}>
                            {tr('connectToSwap')}
                        </button>
                    ) : !isApproved ? (
                        <button className="btn btn-primary w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={handleSetup} disabled={loading}>
                            {loading ? statusText : tr('setupWallet')}
                        </button>
                    ) : (
                        <button className="btn btn-success w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={executeSwap} disabled={loading || !fromAmount}>
                            <Zap size={16} />
                            {loading ? statusText : tr('oneClickSwap')}
                        </button>
                    )}
                </div>
            </div>

            <NotificationModal
                isOpen={notify.open}
                onClose={() => setNotify({ ...notify, open: false })}
                title={notify.title} message={notify.message}
                onConfirm={notify.onConfirm}
                confirmText={notify.onConfirm ? tr('approve') : 'OK'}
                cancelText={tr('cancel')}
            />
        </div>
    );
}
