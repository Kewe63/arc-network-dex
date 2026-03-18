import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Wallet, Menu, X, Shuffle, Droplet, Globe, Coins, Trophy } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';

// Arcdex "A" logo SVG — metallic arc shape
function ArcLogo({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
            <defs>
                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#d0d0d8" />
                    <stop offset="50%" stopColor="#909098" />
                    <stop offset="75%" stopColor="#e0e0e8" />
                    <stop offset="100%" stopColor="#b0b0b8" />
                </linearGradient>
            </defs>
            {/* Arc shape — the "A" arch */}
            <path
                d="M50 8 C28 8 12 26 12 48 L12 72 L26 72 L26 50 C26 34 36 22 50 22 C64 22 74 34 74 50 L74 72 L88 72 L88 48 C88 26 72 8 50 8Z"
                fill="url(#silverGrad)"
            />
            {/* Crossbar of A */}
            <rect x="30" y="56" width="40" height="10" rx="5" fill="url(#silverGrad)" opacity="0.85" />
        </svg>
    );
}

export default function Navbar() {
    const { theme, toggleTheme, address, isConnected, setIsModalOpen, disconnect } = useWallet();
    const { lang, setLang, tr } = useLang();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isLanding = location.pathname === '/';
    const short = addr => addr ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : '';
    const close = () => setIsMenuOpen(false);

    const links = [
        { to: '/swap',        icon: <Shuffle size={14} />, label: 'Swap',        dot: 'live' },
        { to: '/pool',        icon: <Coins size={14} />,   label: 'Pool',        dot: 'live' },
        { to: '/leaderboard', icon: <Trophy size={14} />,  label: 'Leaderboard', dot: 'live' },
        { to: '/bridge',      icon: <Globe size={14} />,   label: 'Bridge',      dot: 'soon' },
        { to: '/faucet',      icon: <Droplet size={14} />, label: 'Faucet',      dot: 'default' },
    ];

    return (
        <nav className="main-nav">
            {/* Logo */}
            <Link to="/" className="logo-mark" onClick={close}>
                <ArcLogo size={30} />
                <span className="logo-wordmark">Arcdex</span>
            </Link>

            {/* Desktop center links */}
            {!isLanding && (
                <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
                    {links.map(l => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            onClick={close}
                        >
                            {l.icon} {l.label}
                            <span className={`nav-dot nav-dot-${l.dot}`} />
                        </NavLink>
                    ))}
                </div>
            )}

            {/* Right actions */}
            <div className="nav-actions">
                {/* Language switcher */}
                <button
                    onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
                    className="btn btn-ghost"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 38 }}
                    title="Switch language"
                >
                    {lang === 'en' ? 'TR' : 'EN'}
                </button>

                <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title="Toggle theme">
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                {!isLanding && (
                    isConnected ? (
                        <div className="flex items-center gap-1">
                            <span className="pill pill-silver desktop-only">
                                <Wallet size={12} /> {short(address)}
                            </span>
                            <button onClick={disconnect} className="btn btn-danger"
                                style={{ padding: '0.45rem 0.875rem', fontSize: '0.8rem' }}>
                                {tr('disconnect')}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => { setIsModalOpen(true); close(); }}
                            className="btn btn-silver"
                            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
                            {tr('connectWallet')}
                        </button>
                    )
                )}

                {!isLanding && (
                    <button className="btn btn-ghost btn-icon mobile-only"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
                    </button>
                )}
            </div>
        </nav>
    );
}
