import React, { useState, useEffect } from 'react';
import SwapCard from '../components/SwapCard';
import ActivityFeed from '../components/ActivityFeed';
import { useWallet } from '../context/WalletContext';
import { usePoints } from '../context/PointsContext';
import { useLang } from '../context/LangContext';
import { Zap, Gift, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function Swap() {
    const { address, isConnected } = useWallet();
    const { lang, tr } = useLang();
    const {
        points, streak, canClaimToday, nextStreakDay, nextStreakPts,
        claimDailyLogin, applyReferralCode, referredBy, STREAK_REWARDS
    } = usePoints();

    const [activities, setActivities] = useState([]);
    const [claimMsg, setClaimMsg] = useState('');
    const [refInput, setRefInput] = useState('');
    const [refMsg, setRefMsg] = useState('');
    const [refOpen, setRefOpen] = useState(false);

    useEffect(() => {
        if (!address) { setActivities([]); return; }
        const key = `arc_activities_${address.toLowerCase()}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try { setActivities(JSON.parse(saved)); } catch { setActivities([]); }
        } else { setActivities([]); }
    }, [address]);

    const handleActivityAdd = act => {
        if (!address) return;
        setActivities(prev => {
            const next = [act, ...prev];
            localStorage.setItem(`arc_activities_${address.toLowerCase()}`, JSON.stringify(next));
            return next;
        });
    };

    const handleClaim = () => {
        const res = claimDailyLogin();
        if (res.alreadyClaimed) {
            setClaimMsg(tr('alreadyClaimed'));
        } else if (res.claimed) {
            setClaimMsg(tr('claimSuccess', { pts: res.pts, streak: res.streak }));
        }
        setTimeout(() => setClaimMsg(''), 3000);
    };

    const handleReferral = () => {
        const res = applyReferralCode(refInput);
        if (res.success) {
            setRefMsg(tr('referralApplied'));
        } else {
            setRefMsg(res.error || tr('error'));
        }
        setTimeout(() => setRefMsg(''), 4000);
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="page-header">
                <div className="page-header-meta">
                    <span className="status-badge status-badge-live">
                        <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                        Live
                    </span>
                    <span className="status-badge status-badge-info">Arc Testnet</span>
                </div>
                <h1 className="page-title silver-text">ARC DEX</h1>
                <p className="page-subtitle">
                    Instant USDC ↔ EURC swaps · Powered by Arc Network · Gas paid in USDC
                </p>
            </div>

            <SwapCard onActivityAdd={handleActivityAdd} />

            {isConnected && (
                <div style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>

                    {/* Total points + daily claim */}
                    <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.2rem' }}>{tr('totalPoints')}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-violet)' }}>{points.toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="font-mono text-xs text-muted" style={{ marginBottom: '0.2rem' }}>{tr('dailyStreak')}</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{streak} / 7</div>
                            </div>
                        </div>

                        {/* Streak progress bar */}
                        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <div key={day} style={{
                                    flex: 1, borderRadius: 4, height: 6,
                                    background: day <= streak ? 'var(--accent-violet)' : 'var(--border-subtle)',
                                    transition: 'background 0.3s'
                                }} />
                            ))}
                        </div>

                        {/* Streak points grid */}
                        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <div key={day} style={{
                                    flex: 1, textAlign: 'center',
                                    padding: '0.3rem 0.1rem',
                                    borderRadius: 6,
                                    background: day <= streak ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${day <= streak ? 'rgba(139,92,246,0.3)' : 'var(--border-subtle)'}`,
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>D{day}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: day === 7 ? '#FFD700' : 'var(--text-primary)' }}>
                                        {STREAK_REWARDS[day]}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className={`btn w-full ${canClaimToday ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '0.65rem', fontSize: '0.875rem' }}
                            onClick={handleClaim}
                            disabled={!canClaimToday}
                        >
                            <Gift size={15} />
                            {canClaimToday
                                ? tr('claimDaily', { pts: nextStreakPts })
                                : tr('claimedToday')}
                        </button>
                        {claimMsg && (
                            <div className="font-mono text-xs" style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--accent-violet)' }}>
                                {claimMsg}
                            </div>
                        )}
                    </div>

                    {/* Referral system */}
                    <div className="glass-card" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <button
                            onClick={() => setRefOpen(o => !o)}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                                <Users size={15} color="var(--accent-green)" />
                                {tr('enterReferral')}
                            </span>
                            {refOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {refOpen && (
                            <div style={{ marginTop: '0.875rem' }}>
                                {referredBy ? (
                                    <div className="font-mono text-xs" style={{ color: 'var(--accent-green)', textAlign: 'center', padding: '0.5rem 0' }}>
                                        {tr('referralUsed', { code: referredBy })}
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className="font-mono text-xs text-muted"
                                            style={{ marginBottom: '0.5rem' }}
                                            dangerouslySetInnerHTML={{ __html: tr('referralHint') }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                value={refInput}
                                                onChange={e => setRefInput(e.target.value.toUpperCase())}
                                                placeholder="ARCxxxxxx"
                                                className="swap-amount-input"
                                                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                                            />
                                            <button
                                                className="btn btn-success"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                onClick={handleReferral}
                                                disabled={!refInput.trim()}
                                            >
                                                {tr('apply')}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {refMsg && (
                                    <div className="font-mono text-xs" style={{ marginTop: '0.5rem', color: refMsg.includes('500') || refMsg.includes('applied') || refMsg.includes('uygulandı') ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {refMsg}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ActivityFeed activities={activities} />
        </div>
    );
}
