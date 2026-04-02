import React, { useState, useEffect } from 'react';
import {
    Briefcase, CheckCircle, AlertCircle, Loader2, ExternalLink,
    RefreshCw, ChevronDown, ChevronUp, Search, UserCheck, CheckSquare, Coins, Send, Banknote
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useERC8183, AGENTIC_COMMERCE_CONTRACT, JOB_STATUS_NAMES } from '../hooks/useERC8183';
import { useLang } from '../context/LangContext';

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

export default function Jobs() {
    const { address, isConnected, signer, setIsModalOpen } = useWallet();
    const { tr } = useLang();

    const {
        actionState, resetAction, createJob, setBudget, fundJob, submitDeliverable, completeJob, fetchJob, jobInfo, isFetchingJob
    } = useERC8183(signer, address, isConnected);

    const [openSection, setOpenSection] = useState('create');
    
    // Form states
    const [cProvider, setCProvider] = useState('');
    const [cDescription, setCDescription] = useState('ERC-8183 demo job');
    
    const [fJobId, setFJobId] = useState('');
    
    // Set Budget
    const [bAmount, setBAmount] = useState('5');
    
    const [sDeliverable, setSDeliverable] = useState('deliverable data');
    const [cReason, setCReason] = useState('approved');

    useEffect(() => {
        if (actionState.step === 'success') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
            import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm').then(({ default: confetti }) => {
                confetti({ particleCount: 160, spread: 150, origin: { y: 0.6 }, colors: ['#ffffff', '#c8c8d0', '#909098', '#e0e0e8', '#606068'], zIndex: 9999 });
            });
            if (actionState.newJobId) {
                setFJobId(actionState.newJobId);
                setTimeout(() => fetchJob(actionState.newJobId), 3000);
                setTimeout(() => setOpenSection('budget'), 3500);
            } else if (fJobId) {
                setTimeout(() => fetchJob(fJobId), 3000);
            }
        }
    }, [actionState.step, actionState.newJobId, fJobId, fetchJob]);

    useEffect(() => {
        if (fJobId) fetchJob(fJobId);
    }, [fJobId, fetchJob]);

    const toggleSection = (s) => setOpenSection(prev => prev === s ? null : s);

    const commonSteps = {
        switching: 'Switching to Arc Testnet...',
        creating: 'Creating Job...',
        setting_budget: 'Setting Budget...',
        approving: 'Approving USDC...',
        funding: 'Funding Escrow...',
        submitting: 'Submitting Deliverable...',
        completing: 'Completing Job...',
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
                        <Briefcase size={32} color="var(--text-secondary)" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        Connect Your Wallet
                    </h2>
                    <p className="font-mono" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Connect your wallet to interact with ERC-8183 Agentic Commerce jobs.
                    </p>
                    <button className="btn btn-silver" style={{ padding: '0.65rem 1.75rem' }} onClick={() => setIsModalOpen(true)}>
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
            <PageHeader />

            {/* Job Fetcher Card */}
            <div
                className="glass-card"
                style={{
                    marginBottom: '1.25rem',
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                            Load Job ID (Optional)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={fJobId}
                            onChange={e => setFJobId(e.target.value)}
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

                {fJobId && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: jobInfo ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border-medium)',
                        background: jobInfo ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                    }}>
                        {isFetchingJob ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Loader2 size={12} className="spin" /> Checking job status...
                            </p>
                        ) : jobInfo ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Job #{jobInfo.id}
                                    </span>
                                    <span className="pill pill-green" style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem' }}>
                                        {jobInfo.status}
                                    </span>
                                    <span className="pill pill-silver" style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem' }}>
                                        {jobInfo.budget} USDC
                                    </span>
                                </div>
                                <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Client: {shortAddr(jobInfo.client)} | Provider: {shortAddr(jobInfo.provider)} | Eval: {shortAddr(jobInfo.evaluator)}
                                </p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Job not found</p>
                        )}
                    </div>
                )}
            </div>

            {/* Action State Feedback for any ongoing task */}
            {actionState.step !== 'idle' && (
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                    <StatusBox state={actionState} successMsg="Transaction successful!" steps={commonSteps} />
                    {actionState.step === 'success' || actionState.step === 'error' ? (
                        <button onClick={resetAction} className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem' }}>
                            Dismiss
                        </button>
                    ) : null}
                </div>
            )}

            {/* Section 1: Create */}
            <SectionCard
                id="create"
                open={openSection === 'create'}
                onToggle={() => toggleSection('create')}
                icon={<Briefcase size={16} color="var(--text-secondary)" />}
                title="Create Job"
                badge="Client"
                badgeColor="silver"
                description="Create a new escrow job and assign a service provider."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Provider Address
                        </label>
                        <input
                            type="text"
                            placeholder="0x..."
                            value={cProvider}
                            onChange={e => setCProvider(e.target.value)}
                            disabled={actionState.isLoading}
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Job Description
                        </label>
                        <input
                            type="text"
                            placeholder="Description..."
                            value={cDescription}
                            onChange={e => setCDescription(e.target.value)}
                            disabled={actionState.isLoading}
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
                    <button
                        onClick={() => createJob(cProvider, address, cDescription)}
                        disabled={actionState.isLoading || !cProvider || !cDescription}
                        className={`btn ${!actionState.isLoading && cProvider ? 'btn-silver' : 'btn-ghost'}`}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        {actionState.isLoading ? 'Processing...' : 'Create Job'}
                    </button>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>* You will be set as both the Client and Evaluator.</p>
                </div>
            </SectionCard>

            {/* Section 2: Set Budget */}
            <SectionCard
                id="budget"
                open={openSection === 'budget'}
                onToggle={() => toggleSection('budget')}
                icon={<Coins size={16} color="#f59e0b" />}
                title="Set Budget"
                badge="Provider"
                badgeColor="yellow"
                description="Set the required USDC amount for the job. Must be called by provider."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Job ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={fJobId}
                            onChange={e => setFJobId(e.target.value)}
                            disabled={actionState.isLoading}
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Amount (USDC)</label>
                        <input
                            type="number"
                            placeholder="e.g. 5"
                            value={bAmount}
                            onChange={e => setBAmount(e.target.value)}
                            disabled={actionState.isLoading}
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
                    <button
                        onClick={() => setBudget(fJobId, bAmount)}
                        disabled={actionState.isLoading || !fJobId || !bAmount || (jobInfo && jobInfo.provider.toLowerCase() !== address.toLowerCase())}
                        className={`btn ${!actionState.isLoading && fJobId ? 'btn-silver' : 'btn-ghost'}`}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        Set Budget
                    </button>
                    {jobInfo && jobInfo.provider.toLowerCase() !== address.toLowerCase() && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-error)' }}>You are not the provider of this job.</p>
                    )}
                </div>
            </SectionCard>

            {/* Section 3: Fund */}
            <SectionCard
                id="fund"
                open={openSection === 'fund'}
                onToggle={() => toggleSection('fund')}
                icon={<Banknote size={16} color="#3b82f6" />}
                title="Fund Escrow"
                badge="Client"
                badgeColor="blue"
                description="Approve USDC and deposit the funds into the escrow."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                     <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Job ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={fJobId}
                            onChange={e => setFJobId(e.target.value)}
                            disabled={actionState.isLoading}
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
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ensure you fund matching the budget set by the provider. (Budget: {jobInfo ? jobInfo.budget : bAmount} USDC)
                    </p>
                    <button
                        onClick={() => fundJob(fJobId, jobInfo ? jobInfo.budget : bAmount)}
                        disabled={actionState.isLoading || !fJobId || (jobInfo && jobInfo.client.toLowerCase() !== address.toLowerCase())}
                        className={`btn ${!actionState.isLoading && fJobId ? 'btn-silver' : 'btn-ghost'}`}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        Approve & Fund Job
                    </button>
                    {jobInfo && jobInfo.client.toLowerCase() !== address.toLowerCase() && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-error)' }}>You are not the client of this job.</p>
                    )}
                </div>
            </SectionCard>

            {/* Section 4: Submit */}
            <SectionCard
                id="submit"
                open={openSection === 'submit'}
                onToggle={() => toggleSection('submit')}
                icon={<Send size={16} color="#db2777" />}
                title="Submit Deliverable"
                badge="Provider"
                badgeColor="pink"
                description="Submit your completed work hash. Moves job to Submitted."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                     <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Job ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={fJobId}
                            onChange={e => setFJobId(e.target.value)}
                            disabled={actionState.isLoading}
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Deliverable Data</label>
                        <input
                            type="text"
                            placeholder="e.g. repository link or data"
                            value={sDeliverable}
                            onChange={e => setSDeliverable(e.target.value)}
                            disabled={actionState.isLoading}
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
                    <button
                        onClick={() => submitDeliverable(fJobId, sDeliverable)}
                        disabled={actionState.isLoading || !fJobId || !sDeliverable || (jobInfo && jobInfo.provider.toLowerCase() !== address.toLowerCase())}
                        className={`btn ${!actionState.isLoading && fJobId ? 'btn-silver' : 'btn-ghost'}`}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        Submit Deliveable
                    </button>
                </div>
            </SectionCard>

            {/* Section 5: Complete */}
            <SectionCard
                id="complete"
                open={openSection === 'complete'}
                onToggle={() => toggleSection('complete')}
                icon={<CheckSquare size={16} color="#22c55e" />}
                title="Complete Job"
                badge="Evaluator"
                badgeColor="green"
                description="Approve the deliverable and release USDC to the provider."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Job ID</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            value={fJobId}
                            onChange={e => setFJobId(e.target.value)}
                            disabled={actionState.isLoading}
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
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Reason</label>
                        <input
                            type="text"
                            placeholder="e.g. approved"
                            value={cReason}
                            onChange={e => setCReason(e.target.value)}
                            disabled={actionState.isLoading}
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
                    <button
                        onClick={() => completeJob(fJobId, cReason)}
                        disabled={actionState.isLoading || !fJobId || !cReason || (jobInfo && jobInfo.evaluator.toLowerCase() !== address.toLowerCase())}
                        className={`btn ${!actionState.isLoading && fJobId ? 'btn-silver' : 'btn-ghost'}`}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                        Complete Job
                    </button>
                    {jobInfo && jobInfo.evaluator.toLowerCase() !== address.toLowerCase() && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-error)' }}>You are not the evaluator of this job.</p>
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
                <span className="status-badge status-badge-info">ERC-8183</span>
                <span className="status-badge status-badge-info">Arc Testnet</span>
            </div>
            <h1 className="page-title">
                <span className="silver-text">Agentic</span> Jobs
            </h1>
            <p className="page-subtitle">
                Create jobs, fund escrows, and complete multi-step agreements utilizing ERC-8183 Agentic Commerce.
            </p>
        </div>
    );
}

function SectionCard({ id, open, onToggle, icon, title, badge, badgeColor, description, children }) {
    const badgeClass = {
        silver: 'pill pill-silver',
        yellow: 'pill pill-yellow',
        green:  'pill pill-green',
        blue:   'pill pill-blue',
        pink:   'pill pill-pink',
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
    return (
        <div className="glass-card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                ERC-8183 Contract
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: 140 }}>AgenticCommerce</span>
                    <a
                        href={`https://testnet.arcscan.app/address/${AGENTIC_COMMERCE_CONTRACT}`}
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
                        {AGENTIC_COMMERCE_CONTRACT.slice(0, 10)}…{AGENTIC_COMMERCE_CONTRACT.slice(-8)}
                        <ExternalLink size={10} />
                    </a>
                </div>
            </div>
        </div>
    );
}
