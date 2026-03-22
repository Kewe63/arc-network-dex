import React, { useState, useEffect } from 'react';
import {
    Bot, CheckCircle, AlertCircle, Loader2, ExternalLink,
    RefreshCw, Star, ShieldCheck, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAgentRegistry, IDENTITY_REGISTRY, REPUTATION_REGISTRY, VALIDATION_REGISTRY } from '../hooks/useAgentRegistry';

const DEFAULT_METADATA_URI = 'ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei';

function shortAddr(addr) {
    return addr ? `${addr.slice(0, 6)}···${addr.slice(-4)}` : '';
}

function TxLink({ hash, label }) {
    if (!hash) return null;
    return (
        <a
            href={`https://testnet.arcscan.app/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.78rem', color: '#34d399', textDecoration: 'none', marginTop: '0.5rem'
            }}
        >
            <span>{label || 'View on Explorer'}</span>
            <ExternalLink size={11} />
        </a>
    );
}

function StatusBox({ state, successMsg, steps }) {
    if (!state.isLoading && !state.error && state.step !== 'success') return null;

    if (state.error) return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239,68,68,0.2)',
            marginTop: '0.75rem'
        }}>
            <AlertCircle size={15} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: '#f87171' }}>{state.error}</span>
        </div>
    );

    if (state.isLoading) {
        const label = steps?.[state.step] || 'Processing...';
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(148,163,184,0.06)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                marginTop: '0.75rem'
            }}>
                <Loader2 size={15} color="var(--text-secondary)" className="spin" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
        );
    }

    if (state.step === 'success') return (
        <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(34,197,94,0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(34,197,94,0.2)',
            marginTop: '0.75rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={15} color="#22c55e" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22c55e' }}>{successMsg}</span>
            </div>
            <TxLink hash={state.txHash} label="View transaction" />
        </div>
    );

    return null;
}

export default function Agent() {
    const { address, isConnected, signer, setIsModalOpen } = useWallet();

    const {
        registerAgent, registerState, resetRegister,
        giveFeedback, reputationState, resetReputation,
        requestValidation, validationState, resetValidation,
        fetchAgentInfo, agentInfo, isFetchingAgent,
    } = useAgentRegistry(signer, address, isConnected);

    const [metadataURI, setMetadataURI]         = useState('');
    const [useDefault, setUseDefault]           = useState(true);
    const [feedbackAgentId, setFeedbackAgentId] = useState('');
    const [feedbackScore, setFeedbackScore]     = useState('95');
    const [feedbackTag, setFeedbackTag]         = useState('successful_trade');
    const [validAgentId, setValidAgentId]       = useState('');
    const [validatorAddr, setValidatorAddr]     = useState('');
    const [openSection, setOpenSection]         = useState('register');
    const [copied, setCopied]                   = useState('');

    useEffect(() => {
        if (isConnected && address) fetchAgentInfo();
    }, [isConnected, address, fetchAgentInfo]);

    useEffect(() => {
        if (registerState.step === 'success') {
            setTimeout(() => fetchAgentInfo(), 3000);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
            import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
                confetti({ particleCount: 160, spread: 150, origin: { y: 0.6 }, colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'], zIndex: 9999 });
            });
        }
    }, [registerState.step, fetchAgentInfo]);

    useEffect(() => {
        if (reputationState.step === 'success') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
            import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
                confetti({ particleCount: 160, spread: 150, origin: { y: 0.6 }, colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'], zIndex: 9999 });
            });
        }
    }, [reputationState.step]);

    useEffect(() => {
        if (validationState.step === 'success') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
            import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
                confetti({ particleCount: 160, spread: 150, origin: { y: 0.6 }, colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'], zIndex: 9999 });
            });
        }
    }, [validationState.step]);

    useEffect(() => {
        if (agentInfo?.agentId) {
            setFeedbackAgentId(agentInfo.agentId);
            setValidAgentId(agentInfo.agentId);
        }
    }, [agentInfo]);

    const finalURI = useDefault ? DEFAULT_METADATA_URI : (metadataURI.trim() || DEFAULT_METADATA_URI);

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const toggleSection = (s) => setOpenSection(prev => prev === s ? null : s);

    const registerSteps = {
        switching: 'Switching to Arc Testnet...',
        registering: 'Sending registration transaction...',
    };
    const feedbackSteps = {
        switching: 'Switching to Arc Testnet...',
        sending: 'Sending feedback transaction...',
    };
    const validationSteps = {
        switching: 'Switching to Arc Testnet...',
        sending: 'Sending validation request...',
    };

    if (!isConnected) {
        return (
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
                <PageHeader />
                <div className="glass-card-elevated" style={{ padding: 'clamp(2rem,5vw,3.5rem)', textAlign: 'center' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-silver)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.75rem'
                    }}>
                        <Bot size={32} color="var(--text-secondary)" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Connect Your Wallet
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Connect your wallet to register AI agents on Arc Testnet using ERC-8004.
                    </p>
                    <button className="btn btn-silver" style={{ padding: '0.65rem 1.75rem' }} onClick={() => setIsModalOpen(true)}>
                        Connect Wallet
                    </button>
                </div>
                <InfoCards />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <PageHeader />

            {/* Agent Status Card */}
            <div
                className="glass-card"
                style={{
                    marginBottom: '1.25rem',
                    padding: '1rem 1.25rem',
                    border: agentInfo ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border-subtle)',
                    background: agentInfo ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 'var(--radius-md)',
                            background: agentInfo ? 'rgba(34,197,94,0.1)' : 'var(--bg-card)',
                            border: `1px solid ${agentInfo ? 'rgba(34,197,94,0.25)' : 'var(--border-medium)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Bot size={17} color={agentInfo ? '#22c55e' : 'var(--text-muted)'} />
                        </div>
                        <div>
                            <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                                {shortAddr(address)}
                            </p>
                            {isFetchingAgent ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Loader2 size={12} className="spin" /> Checking agent status...
                                </p>
                            ) : agentInfo ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Agent #{agentInfo.agentId}
                                    </span>
                                    <span className="pill pill-green" style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem' }}>
                                        Registered
                                    </span>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No agent registered yet</p>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {agentInfo && (
                            <a
                                href={`https://testnet.arcscan.app/token/${IDENTITY_REGISTRY}?a=${agentInfo.agentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                Explorer <ExternalLink size={11} />
                            </a>
                        )}
                        <button
                            onClick={fetchAgentInfo}
                            disabled={isFetchingAgent}
                            className="btn btn-ghost btn-icon"
                            title="Refresh"
                            style={{ width: 32, height: 32 }}
                        >
                            <RefreshCw size={13} className={isFetchingAgent ? 'spin' : ''} />
                        </button>
                    </div>
                </div>

                {agentInfo?.metadataURI && (
                    <div style={{
                        marginTop: '0.75rem', paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <span className="font-mono" style={{
                            fontSize: '0.72rem', color: 'var(--text-muted)',
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {agentInfo.metadataURI}
                        </span>
                        <button
                            onClick={() => copyText(agentInfo.metadataURI, 'uri')}
                            className="btn btn-ghost btn-icon"
                            style={{ width: 24, height: 24, flexShrink: 0 }}
                        >
                            {copied === 'uri' ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Section 1: Register */}
            <SectionCard
                id="register"
                open={openSection === 'register'}
                onToggle={() => toggleSection('register')}
                icon={<Bot size={16} color="var(--text-secondary)" />}
                title="Register Agent Identity"
                badge="ERC-8004"
                badgeColor="silver"
                description="Mint an onchain identity NFT for your AI agent."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Metadata URI
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={useDefault}
                                onChange={e => setUseDefault(e.target.checked)}
                                style={{ accentColor: 'var(--text-primary)', width: 14, height: 14 }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Use example metadata (IPFS)</span>
                        </label>
                        {!useDefault && (
                            <input
                                type="text"
                                placeholder="ipfs://Qm... or https://..."
                                value={metadataURI}
                                onChange={e => setMetadataURI(e.target.value)}
                                disabled={registerState.isLoading}
                                className="swap-amount-input"
                                style={{
                                    width: '100%', fontSize: '0.875rem',
                                    padding: '0.65rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    boxSizing: 'border-box',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-medium)',
                                }}
                            />
                        )}
                        <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            URI: {finalURI.length > 55 ? finalURI.slice(0, 55) + '…' : finalURI}
                        </p>
                    </div>

                    <StatusBox state={registerState} successMsg="Agent registered successfully!" steps={registerSteps} />

                    {registerState.step === 'success' ? (
                        <button onClick={resetRegister} className="btn btn-ghost" style={{ width: '100%', padding: '0.7rem', fontSize: '0.875rem' }}>
                            Register Another
                        </button>
                    ) : (
                        <button
                            onClick={() => registerAgent(finalURI)}
                            disabled={registerState.isLoading}
                            className={`btn ${!registerState.isLoading ? 'btn-silver' : 'btn-ghost'}`}
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                        >
                            {registerState.isLoading
                                ? <><Loader2 size={16} className="spin" /> Registering...</>
                                : <><Bot size={16} /> Register Agent</>
                            }
                        </button>
                    )}
                </div>
            </SectionCard>

            {/* Section 2: Reputation */}
            <SectionCard
                id="reputation"
                open={openSection === 'reputation'}
                onToggle={() => toggleSection('reputation')}
                icon={<Star size={16} color="#f59e0b" />}
                title="Give Reputation Feedback"
                badge="ReputationRegistry"
                badgeColor="yellow"
                description="Record an onchain feedback score for any registered agent."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Agent ID</label>
                            <input
                                type="number"
                                placeholder="e.g. 1"
                                value={feedbackAgentId}
                                onChange={e => setFeedbackAgentId(e.target.value)}
                                disabled={reputationState.isLoading}
                                className="swap-amount-input"
                                style={{
                                    width: '100%', fontSize: '0.875rem',
                                    padding: '0.65rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    boxSizing: 'border-box',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-medium)',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Score (0–100)</label>
                            <input
                                type="number"
                                min="0" max="100"
                                placeholder="95"
                                value={feedbackScore}
                                onChange={e => setFeedbackScore(e.target.value)}
                                disabled={reputationState.isLoading}
                                className="swap-amount-input"
                                style={{
                                    width: '100%', fontSize: '0.875rem',
                                    padding: '0.65rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    boxSizing: 'border-box',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-medium)',
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Tag</label>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {['successful_trade', 'loan_repaid', 'arbitrage_executed', 'slippage_ok'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFeedbackTag(t)}
                                    className={feedbackTag === t ? 'pill pill-yellow' : 'pill'}
                                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: feedbackTag === t ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)' }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Custom tag..."
                            value={feedbackTag}
                            onChange={e => setFeedbackTag(e.target.value)}
                            disabled={reputationState.isLoading}
                            className="swap-amount-input"
                            style={{
                                width: '100%', fontSize: '0.875rem',
                                padding: '0.65rem 0.875rem',
                                borderRadius: 'var(--radius-md)',
                                boxSizing: 'border-box',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-medium)',
                            }}
                        />
                    </div>

                    <div style={{
                        padding: '0.6rem 0.875rem',
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        Note: Per ERC-8004, agent owners cannot give feedback to their own agents.
                    </div>

                    <StatusBox state={reputationState} successMsg="Feedback recorded onchain!" steps={feedbackSteps} />

                    {reputationState.step === 'success' ? (
                        <button onClick={resetReputation} className="btn btn-ghost" style={{ width: '100%', padding: '0.7rem', fontSize: '0.875rem' }}>
                            Give More Feedback
                        </button>
                    ) : (
                        <button
                            onClick={() => giveFeedback(feedbackAgentId, feedbackScore, feedbackTag)}
                            disabled={reputationState.isLoading || !feedbackAgentId || !feedbackScore || !feedbackTag}
                            className={`btn ${!reputationState.isLoading && feedbackAgentId && feedbackScore ? 'btn-silver' : 'btn-ghost'}`}
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                        >
                            {reputationState.isLoading
                                ? <><Loader2 size={16} className="spin" /> Sending...</>
                                : <><Star size={16} /> Submit Feedback</>
                            }
                        </button>
                    )}
                </div>
            </SectionCard>

            {/* Section 3: Validation */}
            <SectionCard
                id="validation"
                open={openSection === 'validation'}
                onToggle={() => toggleSection('validation')}
                icon={<ShieldCheck size={16} color="#22c55e" />}
                title="Request Validation"
                badge="ValidationRegistry"
                badgeColor="green"
                description="Request onchain credential verification for your agent."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Agent ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={validAgentId}
                            onChange={e => setValidAgentId(e.target.value)}
                            disabled={validationState.isLoading}
                            className="swap-amount-input"
                            style={{
                                width: '100%', fontSize: '0.875rem',
                                padding: '0.65rem 0.875rem',
                                borderRadius: 'var(--radius-md)',
                                boxSizing: 'border-box',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-medium)',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Validator Address</label>
                        <input
                            type="text"
                            placeholder="0x..."
                            value={validatorAddr}
                            onChange={e => setValidatorAddr(e.target.value)}
                            disabled={validationState.isLoading}
                            className="swap-amount-input"
                            style={{
                                width: '100%', fontSize: '0.875rem',
                                padding: '0.65rem 0.875rem',
                                borderRadius: 'var(--radius-md)',
                                boxSizing: 'border-box',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-medium)',
                            }}
                        />
                        <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            Must be different from agent owner's address.
                        </p>
                    </div>

                    <StatusBox state={validationState} successMsg="Validation request sent!" steps={validationSteps} />

                    {validationState.step === 'success' ? (
                        <button onClick={resetValidation} className="btn btn-ghost" style={{ width: '100%', padding: '0.7rem', fontSize: '0.875rem' }}>
                            New Request
                        </button>
                    ) : (
                        <button
                            onClick={() => requestValidation(validAgentId, validatorAddr)}
                            disabled={validationState.isLoading || !validAgentId || !validatorAddr}
                            className={`btn ${!validationState.isLoading && validAgentId && validatorAddr ? 'btn-silver' : 'btn-ghost'}`}
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                        >
                            {validationState.isLoading
                                ? <><Loader2 size={16} className="spin" /> Sending...</>
                                : <><ShieldCheck size={16} /> Request Validation</>
                            }
                        </button>
                    )}
                </div>
            </SectionCard>

            <InfoCards />
        </div>
    );
}

function PageHeader() {
    return (
        <div className="page-header">
            <div className="page-header-meta">
                <span className="status-badge status-badge-live">
                    <span className="nav-dot nav-dot-live" style={{ width: 5, height: 5 }} />
                    Live
                </span>
                <span className="status-badge status-badge-info">ERC-8004</span>
                <span className="status-badge status-badge-info">Arc Testnet</span>
            </div>
            <h1 className="page-title">
                <span className="silver-text">AI Agent</span> Registry
            </h1>
            <p className="page-subtitle">
                Register AI agents with onchain identity, build reputation, and verify credentials using ERC-8004.
            </p>
        </div>
    );
}

function SectionCard({ id, open, onToggle, icon, title, badge, badgeColor, description, children }) {
    const badgeClass = {
        silver: 'pill pill-silver',
        yellow: 'pill pill-yellow',
        green:  'pill pill-green',
    }[badgeColor] || 'pill';

    return (
        <div className="glass-card-elevated" style={{ marginBottom: '1rem', overflow: 'hidden' }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '1.1rem 1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '0.75rem', textAlign: 'left', color: 'var(--text-primary)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        {icon}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
                            <span className={badgeClass} style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem' }}>
                                {badge}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{description}</p>
                    </div>
                </div>
                {open
                    ? <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                }
            </button>

            {open && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ paddingTop: '1rem' }}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoCards() {
    const contracts = [
        { label: 'IdentityRegistry',   addr: '0x8004A818BFB912233c491871b3d84c89A494BD9e' },
        { label: 'ReputationRegistry', addr: '0x8004B663056A597Dffe9eCcC1965A193B7388713' },
        { label: 'ValidationRegistry', addr: '0x8004Cb1BF31DAf7788923b405b754f57acEB4272' },
    ];

    return (
        <div className="glass-card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                ERC-8004 Contracts on Arc Testnet
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contracts.map(({ label, addr }) => (
                    <div key={addr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: 140 }}>{label}</span>
                        <a
                            href={`https://testnet.arcscan.app/address/${addr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono"
                            style={{
                                fontSize: '0.72rem', color: 'var(--text-muted)',
                                textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                transition: 'color var(--transition-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {addr.slice(0, 10)}…{addr.slice(-8)}
                            <ExternalLink size={10} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
