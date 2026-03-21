import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Swap from './pages/Swap';
import Faucet from './pages/Faucet';
import Bridge from './pages/Bridge';
import Liquidity from './pages/Liquidity';
import Leaderboard from './pages/Leaderboard';
import Agent from './pages/Agent';
import WalletModal from './components/WalletModal';
import { useWallet } from './context/WalletContext';

function App() {
    const { theme } = useWallet();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="app-container">
            <Navbar />
            <WalletModal />
            <main className="container" style={{ paddingBottom: '4rem', flex: 1 }}>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/swap" element={<Swap />} />
                    <Route path="/faucet" element={<Faucet />} />
                    <Route path="/bridge" element={<Bridge />} />
                    <Route path="/pool" element={<Liquidity />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/agent" element={<Agent />} />
                </Routes>
            </main>

            <footer style={{
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '1.25rem 1.5rem',
                textAlign: 'center',
            }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Built by{' '}
                    <a href="https://github.com/Kewe63" target="_blank" rel="noopener noreferrer"
                        style={{
                            background: 'linear-gradient(135deg, #e8e8ea, #ffffff, #a0a0a8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textDecoration: 'none',
                            fontWeight: 700
                        }}>
                        Kewe63
                    </a>
                </div>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.3rem 0.875rem',
                    background: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    color: 'rgba(251,191,36,0.7)',
                    fontFamily: 'var(--font-mono)',
                }}>
                    ⚠ TESTNET — No real funds. All transactions on Arc Testnet.
                </div>
            </footer>

            <div id="toast-container" />
        </div>
    );
}

export default App;
