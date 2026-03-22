import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function ActivityFeed({ activities }) {
    const { tr } = useLang();
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('all');

    if (!activities || activities.length === 0) return null;

    const filtered = filter === 'all'
        ? activities
        : activities.filter(tx => tx.pair && tx.pair.startsWith(filter));

    const perPage = 5;
    const total = Math.ceil(filtered.length / perPage);
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    const handleFilter = (f) => {
        setFilter(f);
        setPage(1);
    };

    return (
        <div style={{ maxWidth: 480, margin: '1.5rem auto 0' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost w-full"
                style={{
                    justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    marginBottom: isOpen ? '0.75rem' : 0
                }}
            >
                <div className="flex items-center gap-1">
                    <Activity size={16} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tr('recentActivity')}</span>
                    <span className="pill" style={{ fontSize: '0.72rem', padding: '0.15rem 0.6rem' }}>
                        {activities.length}
                    </span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="flex-col gap-1">
                    {/* Filtre butonları */}
                    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                        {[
                            { key: 'all',  label: 'Tümü' },
                            { key: 'USDC', label: 'USDC → EURC' },
                            { key: 'EURC', label: 'EURC → USDC' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                className="percent-chip"
                                onClick={() => handleFilter(key)}
                                style={{
                                    flex: 'none',
                                    padding: '0.28rem 0.75rem',
                                    borderColor: filter === key ? 'var(--border-silver)' : undefined,
                                    color: filter === key ? 'var(--text-primary)' : undefined,
                                    background: filter === key ? 'var(--bg-card-hover)' : undefined,
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {items.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Bu filtrede işlem yok.
                        </div>
                    ) : items.map((tx, idx) => (
                        <div key={idx} className="activity-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{tx.pair}</div>
                                <div className="font-mono text-xs text-muted">
                                    {tx.amount} · {new Date(tx.timestamp).toLocaleTimeString()}
                                </div>
                                {tx.txHash && (
                                    <a
                                        href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-xs"
                                        style={{ marginTop: '0.35rem', color: '#34d399', textDecoration: 'none', fontWeight: 500 }}
                                    >
                                        {tr('viewOnExplorer')} <ExternalLink size={11} />
                                    </a>
                                )}
                            </div>
                            <span className={`pill ${tx.status === 'confirmed' ? 'pill-green' : 'pill-yellow'}`} style={{ fontSize: '0.75rem' }}>
                                {tx.status}
                            </span>
                        </div>
                    ))}

                    {total > 1 && (
                        <div className="flex justify-between items-center" style={{ marginTop: '0.5rem' }}>
                            <button className="btn btn-ghost" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                                onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                                {tr('prev')}
                            </button>
                            <span className="font-mono text-xs text-muted">{page} / {total}</span>
                            <button className="btn btn-ghost" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                                onClick={() => setPage(p => p + 1)} disabled={page === total}>
                                {tr('next')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
