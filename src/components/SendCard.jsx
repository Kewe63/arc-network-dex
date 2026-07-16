import React, { useState } from 'react';
import { ChevronDown, Send, Settings, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import NotificationModal from './NotificationModal';
import { parseUnits, Contract } from 'ethers';

const TOKENS = {
    USDC: {
        address: '0x3600000000000000000000000000000000000000',
        decimals: 6,
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        type: 'erc20'
    },
    EURC: {
        address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
        decimals: 6,
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ctext x='50' y='74' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3E€%3C/text%3E%3C/svg%3E",
        type: 'erc20'
    },
    ARC: {
        address: 'native',
        decimals: 18,
        icon: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='%233E74BB'/%3E%3Cpath d='M50 15 L20 80 L35 80 L40 65 L60 65 L65 80 L80 80 Z' fill='white'/%3E%3C/svg%3E",
        type: 'native'
    }
};

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1];

function TokenDropdown({ open, onClose, activeToken, balances, onSelect }) {
    if (!open) return null;
    return (
        <div className="dropdown-menu" style={{ minWidth: 200 }}>
            {Object.keys(TOKENS).map((symbol) => {
                const active = symbol === activeToken;
                return (
                    <div
                        key={symbol}
                        className={`dropdown-item${active ? ' active' : ''}`}
                        onClick={() => { onClose(); if (!active) onSelect(symbol); }}
                    >
                        <div className="flex items-center gap-1">
                            <img src={TOKENS[symbol].icon} alt={symbol} width={20} height={20} style={{ borderRadius: '50%' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{symbol}</span>
                        </div>
                        <span className="font-mono text-xs text-muted">
                            {parseFloat(balances[symbol] || '0').toFixed(4)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function SendCard({ onActivityAdd }) {
    const { isConnected, balances, setBalances, signer, setIsModalOpen, refreshBalances } = useWallet();
    const { tr } = useLang();

    const [activeToken, setActiveToken] = useState('USDC');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [dropOpen, setDropOpen] = useState(false);
    const [notify, setNotify] = useState({ open: false, title: '', message: '' });

    const activeBal = balances[activeToken] || '0';

    const showNotify = (title, message) => {
        setNotify({ open: true, title, message });
    };

    const handleAmountChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setAmount(val);
        }
    };

    const handlePercent = (pct) => {
        const amt = (parseFloat(activeBal) * pct).toFixed(4);
        setAmount(amt);
    };

    const handleSend = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        if (parseFloat(amount) > parseFloat(activeBal)) {
            showNotify('Insufficient Balance', `You don't have enough ${activeToken}.`);
            return;
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
            showNotify('Invalid Address', 'Please enter a valid recipient address.');
            return;
        }

        try {
            setLoading(true);
            setStatusText(tr('sending'));

            const tokenInfo = TOKENS[activeToken];
            const amountRaw = parseUnits(amount, tokenInfo.decimals);
            
            let txHash = '';

            if (tokenInfo.type === 'native') {
                const tx = await signer.sendTransaction({
                    to: recipient,
                    value: amountRaw
                });
                txHash = tx.hash;
                await tx.wait();
            } else {
                const erc20Abi = ["function transfer(address to, uint256 amount) returns (bool)"];
                const contract = new Contract(tokenInfo.address, erc20Abi, signer);
                const tx = await contract.transfer(recipient, amountRaw);
                txHash = tx.hash;
                await tx.wait();
            }

            setStatusText(tr('sendSuccess'));
            
            setTimeout(() => {
                setBalances(prev => ({
                    ...prev,
                    [activeToken]: (parseFloat(activeBal) - parseFloat(amount)).toFixed(6)
                }));
                if (onActivityAdd) {
                    onActivityAdd({
                        pair: `Sent ${activeToken}`,
                        amount: `${amount} ${activeToken}`,
                        status: 'confirmed',
                        timestamp: Date.now(),
                        txHash: txHash,
                    });
                }
                setAmount('');
                setRecipient('');
                setStatusText('');
            }, 1000);

        } catch (err) {
            console.error(err);
            showNotify('Send Failed', err.message || err.reason || 'An unexpected error occurred.');
            setStatusText('');
        } finally {
            if (!statusText.includes('success') && !statusText.includes('başarılı')) {
                setLoading(false);
            } else {
                setTimeout(() => setLoading(false), 1200);
            }
        }
    };

    return (
        <div className="swap-wrapper mb-4">
            <div className="swap-box">
                {/* Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                    <div className="flex gap-1">
                        <span className="pill pill-silver" style={{ fontSize: '0.72rem' }}>Arc Testnet</span>
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

                {/* Recipient */}
                <div className="swap-input-panel" style={{ marginBottom: '10px' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.55rem' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{tr('recipientAddress')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            placeholder={tr('enterAddress')}
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            disabled={loading}
                            className="swap-amount-input"
                            style={{ fontSize: '0.95rem' }}
                        />
                    </div>
                </div>

                {/* Amount */}
                <div className="swap-input-panel">
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.55rem' }}>
                        <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{tr('amount')}</span>
                        <span className="font-mono text-xs text-muted">
                            {tr('balance')} {parseFloat(activeBal).toFixed(4)} {activeToken}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            placeholder="0.00"
                            value={amount}
                            onChange={handleAmountChange}
                            disabled={loading}
                            className="swap-amount-input"
                        />
                        <div style={{ position: 'relative' }}>
                            <div className="token-badge" onClick={() => !loading && setDropOpen(o => !o)}>
                                <img src={TOKENS[activeToken].icon} alt={activeToken} width={18} height={18} style={{ borderRadius: '50%' }} />
                                {activeToken} <ChevronDown size={13} />
                            </div>
                            <TokenDropdown
                                open={dropOpen}
                                onClose={() => setDropOpen(false)}
                                activeToken={activeToken}
                                balances={balances}
                                onSelect={setActiveToken}
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

                {/* Action button */}
                <div style={{ marginTop: '1rem' }}>
                    {!isConnected ? (
                        <button
                            className="btn btn-silver w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            {tr('connectWallet')}
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary w-full"
                            style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                            onClick={handleSend}
                            disabled={loading || !amount || !recipient}
                        >
                            <Send size={16} />
                            {loading ? statusText : tr('send')}
                        </button>
                    )}
                </div>
            </div>

            <NotificationModal
                isOpen={notify.open}
                onClose={() => setNotify(n => ({ ...n, open: false }))}
                title={notify.title}
                message={notify.message}
                confirmText="OK"
            />
        </div>
    );
}
