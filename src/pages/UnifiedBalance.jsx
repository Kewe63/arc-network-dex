import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { PieChart, RefreshCw, Layers } from 'lucide-react';

const TOKENS = {
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        color: '#2775ca'
    },
    EURC: {
        symbol: 'EURC',
        name: 'Euro Coin',
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ctext x='50' y='74' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3E€%3C/text%3E%3C/svg%3E",
        color: '#10b981'
    },
    ARC: {
        symbol: 'ARC',
        name: 'Arc Native',
        icon: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='%233E74BB'/%3E%3Cpath d='M50 15 L20 80 L35 80 L40 65 L60 65 L65 80 L80 80 Z' fill='white'/%3E%3C/svg%3E",
        color: '#3E74BB'
    }
};

export default function UnifiedBalance() {
    const { isConnected, address, balances, refreshBalances, setIsModalOpen } = useWallet();
    const { tr } = useLang();

    // Calculate a pseudo-total in USD for display purposes
    // Assuming 1 EURC = 1.05 USD for visual calculation, ARC = 1 USD for visual calculation
    const usdcVal = parseFloat(balances.USDC || '0');
    const eurcVal = parseFloat(balances.EURC || '0') * 1.05;
    const arcVal = parseFloat(balances.ARC || '0');
    
    const totalAssetsUsd = usdcVal + eurcVal + arcVal;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-live">
                        <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                        Unified
                    </span>
                    <span className="status-badge status-badge-info">Arc Testnet</span>
                </div>
                <h1 className="page-title silver-text">{tr('balanceTitle')}</h1>
                <p className="page-subtitle">
                    {tr('balanceSubtitle')}
                </p>
            </div>

            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                {!isConnected ? (
                    <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <PieChart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-muted)' }} />
                        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Not Connected</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {tr('connectToSee')}
                        </p>
                        <button className="btn btn-silver" onClick={() => setIsModalOpen(true)}>
                            {tr('connectWallet')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(62,116,187,0.05), rgba(255,255,255,0.01))' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-muted font-mono text-xs uppercase tracking-wider mb-2">{tr('totalAssets')} (USD Eq.)</h2>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                        ${totalAssetsUsd.toFixed(2)}
                                    </div>
                                    <div className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
                                        {tr('walletLabel')} <span className="font-mono text-xs">{address}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={refreshBalances}
                                    className="btn btn-ghost btn-icon"
                                    title="Refresh balances"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers size={16} color="var(--text-muted)" />
                                <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Asset Breakdown</h3>
                            </div>
                            
                            <div className="table-wrapper">
                                <table className="lb-table">
                                    <thead>
                                        <tr>
                                            <th>{tr('asset')}</th>
                                            <th style={{ textAlign: 'right' }}>{tr('balance')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(TOKENS).map(([symbol, info]) => {
                                            const bal = parseFloat(balances[symbol] || '0').toFixed(4);
                                            return (
                                                <tr key={symbol}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: info.color, padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <img src={info.icon} alt={symbol} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{info.name}</div>
                                                                <div className="text-muted font-mono text-xs">{symbol}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 600 }}>
                                                            {bal}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
