import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function Bridge() {
    const { tr } = useLang();
    return (
        <div style={{ paddingBottom: '4rem', maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-soon">
                        <span className="nav-dot nav-dot-soon" style={{ width: 5, height: 5 }} />
                        Coming Soon
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
                    <Clock size={36} color="#818cf8" />
                </div>

                <div style={{
                    display: 'inline-block',
                    padding: '0.6rem 2rem',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: '2rem'
                }}>
                    <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.1em' }}>
                        {tr('comingSoon')}
                    </span>
                </div>

                <p className="font-mono" style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
                    {tr('bridgeBody')}
                </p>

                <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <p className="text-muted text-sm font-mono">
                        {tr('bridgeHint')}
                    </p>
                </div>

                <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <Link to="/swap" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                        {tr('goToSwap')} <ArrowRight size={16} />
                    </Link>
                    <Link to="/faucet" className="btn btn-ghost">
                        {tr('getTestnetTokens')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
