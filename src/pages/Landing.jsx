import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, RefreshCw, Cpu, Users2, BadgeCheck, BarChart3, ChevronDown } from 'lucide-react';
import { useLang } from '../context/LangContext';

/* ── Animated counter ── */
function Counter({ target, suffix = '', duration = 1800 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const tick = (now) => {
                    const p = Math.min((now - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    setVal(Math.floor(ease * target));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Floating token pill ── */
function TokenPill({ symbol, color, top, left, delay }) {
    return (
        <div style={{
            position: 'absolute', top, left,
            padding: '0.35rem 0.85rem',
            background: `rgba(${color},0.08)`,
            border: `1px solid rgba(${color},0.2)`,
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem', fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: `rgba(${color},0.8)`,
            animation: `floatY 4s ease-in-out ${delay}s infinite`,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
            zIndex: 2,
        }}>
            {symbol}
        </div>
    );
}

/* ── Step card ── */
function StepCard({ number, title, body }) {
    return (
        <div style={{
            display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
            padding: '1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.25s',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-silver)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-card)';
            }}
        >
            <div style={{
                minWidth: 40, height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(200,200,210,0.06)',
                border: '1px solid var(--border-silver)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 800,
                fontSize: '0.9rem', color: 'var(--silver-300)',
            }}>
                {number}
            </div>
            <div>
                <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.92rem' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontFamily: 'var(--font-mono)' }}>{body}</div>
            </div>
        </div>
    );
}

export default function Landing() {
    const { tr, lang } = useLang();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const stats = [
        { label: lang === 'tr' ? 'Swap Hacmi (USDC)' : 'Swap Volume (USDC)', value: 2400000, suffix: '+' },
        { label: lang === 'tr' ? 'Aktif Cüzdan' : 'Active Wallets', value: 3800, suffix: '+' },
        { label: lang === 'tr' ? 'Ortalama Gecikme (ms)' : 'Avg Latency (ms)', value: 380, suffix: '' },
        { label: lang === 'tr' ? 'Testnet Blok' : 'Testnet Blocks', value: 91200, suffix: '+' },
    ];

    const pillars = [
        {
            icon: <Cpu size={20} />,
            title: lang === 'tr' ? 'Yerel FX Motoru' : 'Native FX Engine',
            body: lang === 'tr'
                ? 'Arc Network\'ün zincir içi FX motoru, emir defteri ya da AMM havuzu gerektirmeden anlık fiyat uzlaşması sağlar.'
                : 'Arc Network\'s on-chain FX engine settles prices instantly — no order books, no AMM pools required.',
        },
        {
            icon: <RefreshCw size={20} />,
            title: lang === 'tr' ? 'İzinsiz Röle' : 'Permissionless Relay',
            body: lang === 'tr'
                ? 'İmzanız zincir dışında alınır, röle gas\'ı sponsorlar. Cüzdanınızdan hiç ETH çıkmaz.'
                : 'Your signature is taken off-chain and the relayer sponsors gas. No ETH ever leaves your wallet.',
        },
        {
            icon: <Layers size={20} />,
            title: lang === 'tr' ? 'Birleştirilebilir Protokol' : 'Composable Protocol',
            body: lang === 'tr'
                ? 'Her swap, diğer protokollerle zincirlenebilecek atomik bir işlemdir. DeFi stack\'inize doğrudan entegre olun.'
                : 'Every swap is an atomic transaction that can chain with other protocols. Plug directly into your DeFi stack.',
        },
        {
            icon: <BadgeCheck size={20} />,
            title: lang === 'tr' ? 'Denetlenmiş Sözleşmeler' : 'Audited Contracts',
            body: lang === 'tr'
                ? 'Escrow ve swap sözleşmeleri bağımsız denetim firmalarınca incelenmiştir. Testnet önce gelir, mainnet sonra.'
                : 'Escrow and swap contracts have been reviewed by independent auditors. Testnet first, mainnet after.',
        },
        {
            icon: <Users2 size={20} />,
            title: lang === 'tr' ? 'Topluluk Odaklı' : 'Community Driven',
            body: lang === 'tr'
                ? 'Puan sistemi, günlük streak ve referral ödülleriyle erken katılımcılar öne çıkar.'
                : 'Points, daily streaks, and referral rewards put early participants front and centre.',
        },
        {
            icon: <BarChart3 size={20} />,
            title: lang === 'tr' ? 'Anlık Likidite' : 'Instant Liquidity',
            body: lang === 'tr'
                ? 'Havuza likidite ekleyin, swap ücretlerinden pay alın. Çekim her zaman açıktır — kilitleme yok.'
                : 'Deposit into the pool, earn from swap fees. Withdrawals are always open — no lockups.',
        },
    ];

    const steps = lang === 'tr' ? [
        { number: '01', title: 'Cüzdanı Bağla', body: 'MetaMask\'ı Arc Testnet\'e bağlamak saniyeler sürer. Ağ otomatik olarak eklenir.' },
        { number: '02', title: 'Token Al', body: 'Circle Faucet\'ten testnet USDC talep et. Hem gas hem de işlem için yeterli.' },
        { number: '03', title: 'Swap İmzala', body: 'Permit2 mesajını imzala — zincire yazılmadan önce fiyatı onayla.' },
        { number: '04', title: 'Uzlaşmayı Bekle', body: 'Röle işlemi zincire gönderir. Ortalama süre 380 ms. Bakiyeler anında güncellenir.' },
    ] : [
        { number: '01', title: 'Connect Your Wallet', body: 'Linking MetaMask to Arc Testnet takes seconds. The network is added automatically.' },
        { number: '02', title: 'Grab Tokens', body: 'Request testnet USDC from the Circle Faucet — enough for gas and trading.' },
        { number: '03', title: 'Sign the Swap', body: 'Sign a Permit2 message — confirm the rate before anything hits the chain.' },
        { number: '04', title: 'Watch It Settle', body: 'The relayer submits on-chain. Average time is 380 ms. Balances update immediately.' },
    ];

    return (
        <div>
            {/* Keyframe injection */}
            <style>{`
                @keyframes floatY {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-10px); }
                }
                @keyframes revealUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .reveal { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
                .reveal-d1 { animation-delay: 0.1s; }
                .reveal-d2 { animation-delay: 0.22s; }
                .reveal-d3 { animation-delay: 0.34s; }
                .reveal-d4 { animation-delay: 0.46s; }
                .pillar-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }
                .step-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }
                @media (max-width: 900px) {
                    .pillar-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 600px) {
                    .pillar-grid { grid-template-columns: 1fr !important; }
                    .step-grid   { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* ── HERO ── */}
            <section style={{
                position: 'relative', overflow: 'hidden',
                minHeight: '88vh',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '5rem 1.5rem 3rem',
                textAlign: 'center',
            }}>
                {/* Background glow orbs */}
                <div style={{
                    position: 'absolute', top: '-10%', left: '25%',
                    width: 600, height: 400,
                    background: 'radial-gradient(ellipse, rgba(180,180,200,0.055) 0%, transparent 70%)',
                    filter: 'blur(60px)', pointerEvents: 'none',
                    transform: `translateY(${scrollY * 0.15}px)`,
                }} />
                <div style={{
                    position: 'absolute', bottom: '5%', right: '10%',
                    width: 400, height: 300,
                    background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)',
                    filter: 'blur(50px)', pointerEvents: 'none',
                }} />

                {/* Floating token pills */}
                <TokenPill symbol="USDC" color="74,222,128"  top="18%" left="8%"  delay={0} />
                <TokenPill symbol="EURC" color="96,165,250"  top="22%" left="82%" delay={1.2} />
                <TokenPill symbol="ARC"  color="200,200,210" top="62%" left="5%"  delay={0.6} />
                <TokenPill symbol="GAS → 0" color="251,191,36" top="65%" left="85%" delay={1.8} />

                {/* Badge */}
                <div className="reveal" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.875rem',
                    background: 'rgba(200,200,210,0.06)',
                    border: '1px solid var(--border-silver)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem', fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--silver-400)',
                    marginBottom: '2rem', letterSpacing: '0.06em',
                }}>
                    <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                    {lang === 'tr' ? 'Arc Testnet Üzerinde Canlı' : 'Live on Arc Testnet'}
                </div>

                {/* Main headline */}
                <h1 className="reveal reveal-d1" style={{
                    fontSize: 'clamp(2.4rem, 7vw, 5rem)',
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: '-0.045em',
                    marginBottom: '1.5rem',
                    maxWidth: 780,
                }}>
                    {lang === 'tr' ? (
                        <>
                            Stablecoin FX,{' '}
                            <span style={{
                                background: 'linear-gradient(135deg,#e8e8ea 0%,#ffffff 30%,#a0a0a8 60%,#e0e0e8 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>sıfır slip&shy;page</span>
                            {' '}ile.
                        </>
                    ) : (
                        <>
                            Stablecoin FX,{' '}
                            <span style={{
                                background: 'linear-gradient(135deg,#e8e8ea 0%,#ffffff 30%,#a0a0a8 60%,#e0e0e8 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>zero slip&shy;page</span>
                            {'.'}
                        </>
                    )}
                </h1>

                {/* Sub-headline */}
                <p className="reveal reveal-d2 font-mono" style={{
                    fontSize: '1rem', color: 'var(--text-secondary)',
                    maxWidth: 540, margin: '0 auto 2.75rem',
                    lineHeight: 1.85,
                }}>
                    {lang === 'tr'
                        ? 'USDC ile EURC arasında deterministic kurlarla anında takas — emir defteri yok, sarılmış token yok, bekleyiş yok.'
                        : 'Instant settlement between USDC and EURC at deterministic rates — no order books, no wrapped tokens, no waiting.'}
                </p>

                {/* CTA row */}
                <div className="reveal reveal-d3" style={{
                    display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
                    justifyContent: 'center', marginBottom: '3.5rem',
                }}>
                    <Link to="/swap" className="btn btn-silver" style={{
                        fontSize: '0.95rem', padding: '0.8rem 2.2rem',
                        gap: '0.65rem', textDecoration: 'none',
                    }}>
                        {lang === 'tr' ? 'Takas Yap' : 'Start Swapping'} <ArrowRight size={16} />
                    </Link>
                    <Link to="/pool" className="btn btn-ghost" style={{
                        fontSize: '0.95rem', padding: '0.8rem 2.2rem',
                        textDecoration: 'none',
                    }}>
                        {lang === 'tr' ? 'Likidite Sağla' : 'Provide Liquidity'}
                    </Link>
                </div>

                {/* Mini stat strip */}
                <div className="reveal reveal-d4" style={{
                    display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center',
                }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.35rem', fontWeight: 800,
                                fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em',
                                color: 'var(--text-primary)',
                            }}>
                                <Counter target={s.value} suffix={s.suffix} />
                            </div>
                            <div style={{
                                fontSize: '0.7rem', color: 'var(--text-muted)',
                                fontFamily: 'var(--font-mono)', marginTop: '0.15rem',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scroll hint */}
                <div style={{
                    position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    animation: 'floatY 2s ease-in-out infinite',
                    color: 'var(--text-muted)', opacity: 0.5,
                }}>
                    <ChevronDown size={20} />
                </div>
            </section>

            {/* ── PROTOCOL PILLARS ── */}
            <section style={{ padding: '5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ marginBottom: '2.75rem', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--silver-400)', marginBottom: '0.75rem',
                    }}>
                        {lang === 'tr' ? 'Protokol Temelleri' : 'Protocol Pillars'}
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                        fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.2,
                    }}>
                        {lang === 'tr' ? 'Neden Arcdex farklı?' : 'What makes Arcdex different?'}
                    </h2>
                    <p className="font-mono" style={{
                        fontSize: '0.875rem', color: 'var(--text-secondary)',
                        marginTop: '0.6rem', maxWidth: 480, margin: '0.6rem auto 0',
                    }}>
                        {lang === 'tr'
                            ? 'Sıradan bir DEX arayüzü değil — Arc\'ın altyapısına özgü bir protokol.'
                            : 'Not just another DEX interface — a protocol purpose-built for Arc\'s infrastructure.'}
                    </p>
                </div>

                <div className="pillar-grid">
                    {pillars.map((p, i) => (
                        <div key={i} className="feature-card" style={{ flexDirection: 'column', gap: '0.875rem' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                                background: 'rgba(200,200,210,0.06)',
                                border: '1px solid var(--border-silver)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--silver-300)',
                            }}>
                                {p.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.92rem' }}>{p.title}</div>
                                <div className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{p.body}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW TO START ── */}
            <section style={{ padding: '0 1.5rem 5rem', maxWidth: 920, margin: '0 auto' }}>
                <div style={{
                    background: 'var(--swap-box-bg)',
                    border: '1px solid var(--border-silver)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'clamp(2rem, 5vw, 3.5rem)',
                    boxShadow: 'var(--shadow-card), var(--shadow-inset)',
                }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{
                            fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: 'var(--silver-400)', marginBottom: '0.6rem',
                        }}>
                            {lang === 'tr' ? 'Başlangıç Rehberi' : 'Getting Started'}
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                            fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2,
                        }}>
                            {lang === 'tr' ? 'İlk swapınız 4 adımda.' : 'Your first swap in 4 steps.'}
                        </h2>
                        <p className="font-mono" style={{
                            fontSize: '0.82rem', color: 'var(--text-secondary)',
                            marginTop: '0.5rem', lineHeight: 1.8,
                        }}>
                            {lang === 'tr'
                                ? 'Testnet ortamında gerçek para riski olmadan Arc protokolünü keşfedin.'
                                : 'Explore the Arc protocol in a testnet environment — no real funds at risk.'}
                        </p>
                    </div>

                    <div className="step-grid" style={{ marginBottom: '2.25rem' }}>
                        {steps.map((s, i) => (
                            <StepCard key={i} number={s.number} title={s.title} body={s.body} />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link to="/swap" className="btn btn-silver" style={{
                            textDecoration: 'none', gap: '0.6rem',
                            padding: '0.7rem 1.75rem', fontSize: '0.9rem',
                        }}>
                            {lang === 'tr' ? 'Uygulamayı Aç' : 'Open the App'} <ArrowRight size={15} />
                        </Link>
                        <Link to="/faucet" className="btn btn-ghost" style={{
                            textDecoration: 'none',
                            padding: '0.7rem 1.75rem', fontSize: '0.9rem',
                        }}>
                            {lang === 'tr' ? 'Testnet Token Al' : 'Get Testnet Tokens'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA STRIP ── */}
            <section style={{
                padding: '0 1.5rem 6rem',
                maxWidth: 1100, margin: '0 auto',
                textAlign: 'center',
            }}>
                <div style={{
                    padding: '3rem 2rem',
                    background: 'rgba(200,200,210,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-40%', left: '30%',
                        width: 500, height: 300,
                        background: 'radial-gradient(ellipse, rgba(200,200,210,0.06) 0%, transparent 70%)',
                        filter: 'blur(40px)', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{
                            fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: 'var(--silver-400)', marginBottom: '0.75rem',
                        }}>
                            {lang === 'tr' ? 'Sıralamada Yüksel' : 'Climb the Ranks'}
                        </p>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                            fontWeight: 800, letterSpacing: '-0.035em',
                            marginBottom: '0.875rem', lineHeight: 1.2,
                        }}>
                            {lang === 'tr'
                                ? 'Her işlem puana dönüşür.'
                                : 'Every action earns points.'}
                        </h2>
                        <p className="font-mono" style={{
                            fontSize: '0.875rem', color: 'var(--text-secondary)',
                            maxWidth: 460, margin: '0 auto 2rem', lineHeight: 1.85,
                        }}>
                            {lang === 'tr'
                                ? 'Swap yap, günlük giriş yap, arkadaşlarını davet et. Her eylem seni sıralamada yukarı taşır.'
                                : 'Swap, check in daily, invite friends. Every action moves you up the leaderboard.'}
                        </p>
                        <Link to="/leaderboard" className="btn btn-ghost" style={{
                            textDecoration: 'none',
                            padding: '0.7rem 2rem', fontSize: '0.9rem',
                        }}>
                            {lang === 'tr' ? 'Sıralamayı Gör' : 'View Leaderboard'} →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
