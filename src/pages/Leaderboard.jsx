import React, { useState } from 'react';
import { usePoints } from '../context/PointsContext';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { Trophy, Medal, Star, Copy, Check, Flame, Gift, Users } from 'lucide-react';

function shortAddr(addr) {
    return addr ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : '';
}

const STREAK_POINTS = [10, 20, 30, 40, 50, 70, 100];

export default function Leaderboard() {
    const {
        leaderboard, points, referralCode, streak,
        volumePoints, streakPoints, referralPoints,
        canClaimToday, claimDailyLogin, applyReferralCode,
        nextStreakDay, nextStreakPts,
    } = usePoints();
    const { address, isConnected, setIsModalOpen } = useWallet();
    const { tr } = useLang();

    const [copied, setCopied] = useState(false);
    const [refInput, setRefInput] = useState('');
    const [refMsg, setRefMsg] = useState(null);
    const [claimMsg, setClaimMsg] = useState(null);

    const myRank = leaderboard.findIndex(e => e.address?.toLowerCase() === address?.toLowerCase()) + 1;

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClaim = () => {
        const result = claimDailyLogin();
        if (result.claimed) {
            setClaimMsg({ ok: true, text: tr('claimSuccess', { pts: result.pts, streak: result.streak }) });
        } else if (result.alreadyClaimed) {
            setClaimMsg({ ok: false, text: tr('alreadyClaimed') });
        }
        setTimeout(() => setClaimMsg(null), 3000);
    };

    const handleRef = () => {
        const result = applyReferralCode(refInput);
        if (result.success) {
            setRefMsg({ ok: true, text: tr('refSuccess') });
            setRefInput('');
        } else {
            setRefMsg({ ok: false, text: result.error });
        }
        setTimeout(() => setRefMsg(null), 3000);
    };

    const rankIcon = (i) => {
        if (i === 0) return <Trophy size={16} color="#FFD700" />;
        if (i === 1) return <Medal size={16} color="#C0C0C0" />;
        if (i === 2) return <Medal size={16} color="#CD7F32" />;
        return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 20, textAlign: 'center' }}>#{i + 1}</span>;
    };

    return (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-live">
                        <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                        Live
                    </span>
                    <span className="status-badge status-badge-info">Points</span>
                </div>
                <h1 className="page-title silver-text">Leaderboard</h1>
                <p className="page-subtitle">{tr('lbSubtitle')}</p>
            </div>

            {isConnected ? (
                <>
                    {/* User summary card */}
                    <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.05)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.3rem' }}>{tr('yourWallet')}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{shortAddr(address)}</div>
                                {myRank > 0 && (
                                    <div className="font-mono text-xs" style={{ color: '#8b5cf6', marginTop: '0.25rem' }}>
                                        {tr('yourRank', { rank: myRank })}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {[
                                    { label: tr('totalPoints'),      val: points },
                                    { label: tr('volumePts'),        val: volumePoints },
                                    { label: tr('streakPts'),        val: streakPoints },
                                    { label: tr('referralPts'),      val: referralPoints },
                                    { label: tr('dailyStreakLabel'), val: `${streak} / 7` },
                                ].map((s, i) => (
                                    <div key={i} className="stat-card" style={{ padding: '0.75rem 1rem', textAlign: 'center', minWidth: 90 }}>
                                        <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.25rem' }}>{s.label}</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#8b5cf6' }}>{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Daily Check-in */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Flame size={18} color="#f97316" /> {tr('dailyCheckin')}
                        </h2>

                        {/* Streak progress tiles */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {STREAK_POINTS.map((pts, idx) => {
                                const day = idx + 1;
                                const done = streak >= day;
                                return (
                                    <div key={day} style={{
                                        flex: '1', minWidth: 52, textAlign: 'center',
                                        padding: '0.5rem 0.3rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${done ? 'rgba(249,115,22,0.5)' : 'var(--border-subtle)'}`,
                                        background: done ? 'rgba(249,115,22,0.12)' : 'var(--bg-card)',
                                        transition: 'all 0.2s',
                                    }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                                            {tr('dayLabel', { n: day })}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: done ? '#f97316' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>+{pts}</div>
                                        {done && <div style={{ fontSize: '0.6rem', color: '#f97316', marginTop: '0.15rem' }}>✓</div>}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-silver"
                                style={{ padding: '0.6rem 1.5rem', opacity: canClaimToday ? 1 : 0.5 }}
                                onClick={handleClaim}
                                disabled={!canClaimToday}
                            >
                                <Flame size={15} />
                                {canClaimToday ? tr('checkinBtn', { pts: nextStreakPts }) : tr('checkinDone')}
                            </button>
                            {claimMsg && (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: claimMsg.ok ? '#4ade80' : '#f87171' }}>
                                    {claimMsg.text}
                                </span>
                            )}
                            {!canClaimToday && (
                                <span className="font-mono text-xs text-muted">
                                    {tr('tomorrow', { day: nextStreakDay, pts: nextStreakPts })}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Referral system */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} color="#8b5cf6" /> {tr('referralSystem')}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                            {/* Own code */}
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.4rem' }}>{tr('yourCode')}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.875rem' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.9rem' }}>{referralCode}</span>
                                    <button onClick={copyCode} className="btn btn-ghost btn-icon" style={{ width: 24, height: 24 }} title={tr('copy')}>
                                        {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                                    </button>
                                </div>
                                <p
                                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}
                                    dangerouslySetInnerHTML={{ __html: tr('referralShareHint') }}
                                />
                            </div>
                            {/* Enter code */}
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.4rem' }}>{tr('enterCode')}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={refInput}
                                        onChange={e => setRefInput(e.target.value)}
                                        placeholder="ARCXXXXXX"
                                        style={{
                                            flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                                            borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem',
                                            fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                                            color: 'var(--text-primary)', outline: 'none',
                                        }}
                                    />
                                    <button className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }} onClick={handleRef}>
                                        <Gift size={14} /> {tr('apply')}
                                    </button>
                                </div>
                                {refMsg && (
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontFamily: 'var(--font-mono)', color: refMsg.ok ? '#4ade80' : '#f87171' }}>
                                        {refMsg.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard table */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Star size={18} color="#FFD700" /> {tr('top100')}
                        </h2>

                        {leaderboard.length === 0 ? (
                            <div className="text-center font-mono text-muted" style={{ padding: '2rem 0' }}>
                                {tr('noEntries')}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{tr('rank')}</th>
                                            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{tr('wallet')}</th>
                                            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{tr('points')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((entry, i) => {
                                            const isMe = entry.address?.toLowerCase() === address?.toLowerCase();
                                            return (
                                                <tr key={entry.address}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-subtle)',
                                                        background: isMe ? 'rgba(139,92,246,0.08)' : 'transparent',
                                                        transition: 'background 0.15s',
                                                    }}>
                                                    <td style={{ padding: '0.75rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        {rankIcon(i)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.75rem', fontFamily: 'var(--font-mono)' }}>
                                                        {shortAddr(entry.address)}
                                                        {isMe && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 700 }}>{tr('you')}</span>}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: i < 3 ? '#FFD700' : 'var(--text-primary)' }}>
                                                        {entry.totalPoints.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Trophy size={40} color="#FFD700" style={{ marginBottom: '1rem' }} />
                    <p className="font-mono text-muted" style={{ marginBottom: '1.25rem' }}>{tr('connectToSee')}</p>
                    <button className="btn btn-silver" style={{ padding: '0.6rem 1.5rem' }} onClick={() => setIsModalOpen(true)}>
                        {tr('connectWallet')}
                    </button>
                </div>
            )}
        </div>
    );
}
