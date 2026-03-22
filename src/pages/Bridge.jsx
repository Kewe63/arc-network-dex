import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { useBridgeKit, SEPOLIA_CHAIN_ID, ARC_CHAIN_ID } from '../hooks/useBridgeKit';

export default function Bridge() {
    const { address, isConnected } = useWallet();
    const { tr } = useLang();

    const {
        state,
        tokenBalance,
        isLoadingBalance,
        balanceError,
        fetchTokenBalance,
        bridge,
        reset,
    } = useBridgeKit(address, isConnected);

    const [amount, setAmount] = useState('');
    const [direction, setDirection] = useState('sepolia-to-arc');

    const isSepoliaToArc = direction === 'sepolia-to-arc';
    const sourceChainId = isSepoliaToArc ? SEPOLIA_CHAIN_ID : ARC_CHAIN_ID;
    const sourceChainName = isSepoliaToArc ? 'Sepolia' : 'Arc Testnet';
    const destinationChainName = isSepoliaToArc ? 'Arc Testnet' : 'Sepolia';

    // Fetch balance when connected or direction changes
    useEffect(() => {
        if (isConnected && address) {
            fetchTokenBalance('USDC', sourceChainId);
        }
    }, [isConnected, address, sourceChainId, fetchTokenBalance]);

    // Save successful transactions to localStorage + confetti + sound
    useEffect(() => {
        if (state.step === 'success' && state.direction && amount) {
            const transaction = {
                id: `${Date.now()}`,
                type: 'bridge',
                direction: state.direction,
                amount,
                fromNetwork: sourceChainName,
                toNetwork: destinationChainName,
                timestamp: new Date().toISOString(),
                sourceTxHash: state.sourceTxHash,
                receiveTxHash: state.receiveTxHash,
            };
            const existing = JSON.parse(localStorage.getItem('bridgeTransactions') || '[]');
            if (!existing.some(t => t.id === transaction.id)) {
                existing.unshift(transaction);
                localStorage.setItem('bridgeTransactions', JSON.stringify(existing.slice(0, 10)));
            }

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
    }, [state.step, state.direction, amount, sourceChainName, destinationChainName, state.sourceTxHash, state.receiveTxHash]);

    const numericBalance = parseFloat(tokenBalance) || 0;
    const exceedsBalance = !isLoadingBalance && numericBalance > 0 && parseFloat(amount) > numericBalance;
    const amountValid = !!amount && parseFloat(amount) > 0 && !exceedsBalance;

    const handleSwapDirection = () => {
        setDirection(d => d === 'sepolia-to-arc' ? 'arc-to-sepolia' : 'sepolia-to-arc');
        setAmount('');
        reset();
    };

    const handleBridge = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        await bridge('USDC', amount, direction);
    };

    const handleReset = () => {
        reset();
        setAmount('');
    };

    if (!isConnected) {
        return (
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
                <div className="page-header">
                    <div className="page-header-meta">
                        <span className="status-badge status-badge-live">
                            <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                            Live
                        </span>
                        <span className="status-badge status-badge-info">Cross-Chain</span>
                    </div>
                    <h1 className="page-title">
                        <span className="silver-text">Bridge</span> Assets
                    </h1>
                    <p className="page-subtitle">{tr('bridgeSubtitle')}</p>
                </div>

                <div className="glass-card-elevated" style={{ padding: 'clamp(2rem,5vw,3.5rem)', textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'rgba(99,102,241,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <ArrowLeftRight size={36} color="#818cf8" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Connect Your Wallet
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Connect your wallet to bridge USDC between Sepolia and Arc Testnet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-live">
                        <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                        Live
                    </span>
                    <span className="status-badge status-badge-info">Cross-Chain</span>
                </div>
                <h1 className="page-title">
                    <span className="silver-text">Bridge</span> Assets
                </h1>
                <p className="page-subtitle">{tr('bridgeSubtitle')}</p>
            </div>

            <div className="glass-card-elevated" style={{ padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Bridge USDC</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Chain Direction Selector */}
                    <div className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>From</p>
                                <p style={{ fontWeight: 700 }}>{sourceChainName}</p>
                            </div>
                            <button
                                onClick={handleSwapDirection}
                                disabled={state.isLoading}
                                style={{
                                    margin: '0 1rem',
                                    padding: '0.5rem',
                                    background: state.isLoading ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.8)',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: state.isLoading ? 'not-allowed' : 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <ArrowLeftRight size={18} />
                            </button>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>To</p>
                                <p style={{ fontWeight: 700 }}>{destinationChainName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Token Display */}
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Token</label>
                        <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontWeight: 700 }}>USDC</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(USD Coin)</span>
                        </div>
                    </div>

                    {/* Balance */}
                    {isLoadingBalance ? (
                        <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Loader2 size={15} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading balance...</span>
                        </div>
                    ) : balanceError ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertCircle size={15} color="#f87171" />
                            <span style={{ fontSize: '0.85rem', color: '#f87171' }}>{balanceError}</span>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sourceChainName} USDC Balance</span>
                                <button
                                    onClick={() => fetchTokenBalance('USDC', sourceChainId)}
                                    disabled={isLoadingBalance}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                                    title="Refresh balance"
                                >
                                    <RefreshCw size={13} />
                                </button>
                            </div>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tokenBalance} USDC</p>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Amount</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            disabled={state.isLoading}
                            className="swap-amount-input"
                            style={{ width: '100%', fontSize: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', boxSizing: 'border-box' }}
                        />
                        {exceedsBalance && (
                            <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>Amount exceeds balance</p>
                        )}
                    </div>

                    {/* Status: Error */}
                    {state.error && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertCircle size={15} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.875rem', color: '#f87171' }}>{state.error}</span>
                        </div>
                    )}

                    {/* Status: Loading */}
                    {state.isLoading && state.step !== 'success' && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <Loader2 size={15} color="#818cf8" style={{ marginTop: 2, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                            <div style={{ fontSize: '0.875rem' }}>
                                <p style={{ fontWeight: 700, color: '#818cf8' }}>
                                    {state.step === 'switching-network' && 'Switching network...'}
                                    {state.step === 'approving' && 'Processing transaction...'}
                                    {state.step === 'signing-bridge' && 'Confirming bridge...'}
                                    {state.step === 'waiting-receive-message' && 'Completing bridge on destination...'}
                                    {!['switching-network', 'approving', 'signing-bridge', 'waiting-receive-message'].includes(state.step) && 'Processing...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Status: Success */}
                    {state.step === 'success' && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <CheckCircle size={15} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ fontSize: '0.875rem' }}>
                                    <p style={{ fontWeight: 700, color: '#34d399' }}>Bridge Successful!</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        USDC transferred from {sourceChainName} to {destinationChainName}
                                    </p>
                                </div>
                            </div>
                            {(state.sourceTxHash || state.receiveTxHash) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                                    {state.sourceTxHash && (
                                        <a
                                            href={isSepoliaToArc
                                                ? `https://sepolia.etherscan.io/tx/${state.sourceTxHash}`
                                                : `https://testnet.arcscan.app/tx/${state.sourceTxHash}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#34d399', textDecoration: 'none' }}
                                        >
                                            <span>View {sourceChainName} Tx</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                                    {state.receiveTxHash && (
                                        <a
                                            href={!isSepoliaToArc
                                                ? `https://sepolia.etherscan.io/tx/${state.receiveTxHash}`
                                                : `https://testnet.arcscan.app/tx/${state.receiveTxHash}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#34d399', textDecoration: 'none' }}
                                        >
                                            <span>View {destinationChainName} Tx</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bridge Button */}
                    <button
                        className={`btn ${!state.isLoading && amountValid ? 'btn-silver' : 'btn-ghost'}`}
                        onClick={handleBridge}
                        disabled={state.isLoading || !amountValid}
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {state.isLoading ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                {state.step === 'switching-network' ? 'Switching Network...' : 'Bridging...'}
                            </>
                        ) : state.step === 'success' ? (
                            'Bridge Complete ✓'
                        ) : (
                            `Bridge ${amount || '0'} USDC`
                        )}
                    </button>

                    {/* Reset after success */}
                    {state.step === 'success' && (
                        <button
                            onClick={handleReset}
                            className="btn btn-ghost"
                            style={{ width: '100%', padding: '0.65rem', fontSize: '0.875rem' }}
                        >
                            Bridge Again
                        </button>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="glass-card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Bridge Process</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {[
                        ['1. Switch', 'Wallet switches to the source chain (Sepolia or Arc Testnet)'],
                        ['2. Approve', 'Approve USDC spending for the Circle Bridge contract'],
                        ['3. Bridge', 'USDC is locked/burned on the source chain'],
                        ['4. Receive', 'USDC is minted/released on the destination chain'],
                    ].map(([step, desc]) => (
                        <p key={step} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>{step}:</strong> {desc}
                        </p>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
