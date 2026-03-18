import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Activity, ArrowRight, Play, TrendingUp, Globe, Lock } from 'lucide-react';
import { useLang } from '../context/LangContext';

function ArcLogo({ size = 48 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="silverGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#d0d0d8" />
                    <stop offset="50%" stopColor="#909098" />
                    <stop offset="75%" stopColor="#e0e0e8" />
                    <stop offset="100%" stopColor="#b0b0b8" />
                </linearGradient>
            </defs>
            <path
                d="M50 8 C28 8 12 26 12 48 L12 72 L26 72 L26 50 C26 34 36 22 50 22 C64 22 74 34 74 50 L74 72 L88 72 L88 48 C88 26 72 8 50 8Z"
                fill="url(#silverGradHero)"
            />
            <rect x="30" y="56" width="40" height="10" rx="5" fill="url(#silverGradHero)" opacity="0.85" />
        </svg>
    );
}

export default function Landing() {
    const { tr } = useLang();
    const [typedText, setTypedText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);

    const phrases = [
        { prefix: tr('phrase0Prefix'), text: tr('phrase0Text') },
        { prefix: tr('phrase1Prefix'), text: tr('phrase1Text') },
        { prefix: tr('phrase2Prefix'), text: tr('phrase2Text') },
        { prefix: tr('phrase3Prefix'), text: tr('phrase3Text') },
    ];

    useEffect(() => {
        let idx = 0, isDeleting = false, timeout;
        const currentText = phrases[phraseIndex % phrases.length].text;
        const type = () => {
            setTypedText(currentText.substring(0, idx));
            if (!isDeleting && idx === currentText.length) {
                timeout = setTimeout(() => { isDeleting = true; type(); }, 2000);
            } else if (isDeleting && idx === 0) {
                isDeleting = false;
                setPhraseIndex(p => p + 1);
                timeout = setTimeout(type, 400);
            } else {
                idx += isDeleting ? -1 : 1;
                timeout = setTimeout(type, isDeleting ? 45 : 90);
            }
        };
        timeout = setTimeout(type, 400);
        return () => clearTimeout(timeout);
    }, [phraseIndex, tr]);

    const features = [
        { icon: <Zap size={18} />, title: tr('feat0Title'), desc: tr('feat0Desc') },
        { icon: <ShieldCheck size={18} />, title: tr('feat1Title'), desc: tr('feat1Desc') },
        { icon: <Activity size={18} />, title: tr('feat2Title'), desc: tr('feat2Desc') },
        { icon: <Globe size={18} />, title: tr('feat3Title'), desc: tr('feat3Desc') },
        { icon: <Lock size={18} />, title: tr('feat4Title'), desc: tr('feat4Desc') },
        { icon: <TrendingUp size={18} />, title: tr('feat5Title'), desc: tr('feat5Desc') },
    ];

    return (
        <div style={{ paddingBottom: '6rem' }}>
            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '5rem 1.5rem 4rem', position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 500, height: 250,
                    background: 'radial-gradient(ellipse, rgba(200,200,210,0.07) 0%, transparent 70%)',
                    pointerEvents: 'none', filter: 'blur(40px)', zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <ArcLogo size={56} />
                        <span style={{
                            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            background: 'linear-gradient(135deg, #e8e8ea 0%, #ffffff 25%, #a0a0a8 50%, #ffffff 75%, #c8c8cc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Arcdex
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.03em',
                        color: 'var(--text-primary)'
                    }}>
                        {phrases[phraseIndex % phrases.length].prefix}
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #e8e8ea 0%, #ffffff 30%, #a0a0a8 60%, #e0e0e8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            {typedText}<span className="cursor-blink" />
                        </span>
                    </h1>

                    <p className="font-mono" style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        maxWidth: 520,
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.8
                    }}>
                        {tr('heroSubtitle')}
                    </p>

                    <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap' }}>
                        <Link to="/swap" className="btn btn-silver"
                            style={{ fontSize: '0.95rem', padding: '0.75rem 2rem', gap: '0.65rem', textDecoration: 'none' }}>
                            {tr('launchApp')} <Play size={16} fill="#0a0a0b" />
                        </Link>
                        <Link to="/pool" className="btn btn-ghost"
                            style={{ fontSize: '0.95rem', padding: '0.75rem 2rem', textDecoration: 'none' }}>
                            {tr('addLiquidity')} →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container" style={{ marginBottom: '3.5rem' }}>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem',
                    textAlign: 'center', letterSpacing: '-0.02em',
                    color: 'var(--text-primary)'
                }}>
                    {tr('whyArcdex')}
                </h2>
                <p className="text-muted text-center text-sm" style={{ marginBottom: '2rem' }}>
                    {tr('whySubtitle')}
                </p>
                <div className="grid-auto">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">
                                <span style={{ color: 'var(--silver-300)' }}>{f.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>{f.title}</div>
                                <div className="text-xs text-muted" style={{ lineHeight: 1.6 }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="container">
                <div className="glass-card-elevated" style={{ padding: 'clamp(1.75rem,4vw,3rem)' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.875rem', letterSpacing: '-0.02em' }}>
                        {tr('howItWorks')}
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.875rem', lineHeight: 1.85, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        {tr('howItWorksBody')}
                    </p>
                    <Link to="/swap" className="btn btn-silver" style={{ gap: '0.6rem', textDecoration: 'none', display: 'inline-flex' }}>
                        {tr('startTrading')} <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
