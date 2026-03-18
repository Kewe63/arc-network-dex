import React from 'react';
import { Droplet, ExternalLink, Zap } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function Faucet() {
    const { tr } = useLang();
    const steps = [
        tr('faucetStep0'),
        tr('faucetStep1'),
        tr('faucetStep2'),
        tr('faucetStep3'),
        tr('faucetStep4'),
    ];

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: 700, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-info">
                        <span className="nav-dot nav-dot-default" style={{ width: 5, height: 5 }} />
                        External
                    </span>
                    <span className="status-badge status-badge-info">Testnet Tokens</span>
                </div>
                <h1 className="page-title">
                    {tr('faucetTitle').split('Wallet').length > 1
                        ? <>{tr('faucetTitle').split('Wallet')[0]}<span className="silver-text">Wallet</span>{tr('faucetTitle').split('Wallet')[1]}</>
                        : tr('faucetTitle')
                    }
                </h1>
                <p className="page-subtitle">{tr('faucetSubtitle')}</p>
            </div>

            <div className="glass-card-elevated" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(124,58,237,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <Droplet size={32} color="#a78bfa" />
                </div>

                <p className="font-mono" style={{ fontSize: '1rem', lineHeight: 1.75, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {tr('faucetBody')}
                </p>

                <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '1.05rem', padding: '0.875rem 2.5rem', textDecoration: 'none' }}
                >
                    {tr('openFaucet')} <ExternalLink size={18} />
                </a>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="flex items-center gap-1" style={{ marginBottom: '0.75rem' }}>
                    <Zap size={16} color="#f59e0b" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tr('quickSteps')}</span>
                </div>
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.74rem', fontWeight: 700, flexShrink: 0
                        }}>{i + 1}</span>
                        <span className="font-mono text-sm text-muted">{step}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
