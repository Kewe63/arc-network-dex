import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';
import { X, Wallet } from 'lucide-react';

const modalText = {
    en: {
        title: 'Connect Wallet',
        subtitle: 'Choose your preferred wallet',
        browserWallet: 'Browser extension wallet',
        mobileWallet: 'Mobile & multi-wallet',
        disclaimer: 'Testnet app — no real funds involved.',
    },
    tr: {
        title: 'Cüzdan Bağla',
        subtitle: 'Tercih ettiğin cüzdanı seç',
        browserWallet: 'Tarayıcı uzantısı cüzdanı',
        mobileWallet: 'Mobil & çoklu cüzdan',
        disclaimer: 'Testnet uygulaması — gerçek para içermez.',
    },
};

export default function WalletModal() {
    const { isModalOpen, setIsModalOpen, connectWallet } = useWallet();
    const { lang } = useLang();
    if (!isModalOpen) return null;

    const m = modalText[lang] || modalText.en;

    return (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                            {m.title}
                        </h3>
                        <p className="text-xs text-muted">{m.subtitle}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-icon">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-col gap-1">
                    <button
                        className="btn btn-ghost w-full"
                        onClick={() => connectWallet('metamask')}
                        style={{
                            justifyContent: 'flex-start', padding: '0.875rem 1.1rem',
                            fontSize: '0.9rem', gap: '0.875rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-silver)'
                        }}
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                            alt="MetaMask" width={26} />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>MetaMask</div>
                            <div className="text-xs text-muted">{m.browserWallet}</div>
                        </div>
                    </button>

                    <button
                        className="btn btn-ghost w-full"
                        onClick={() => connectWallet('walletconnect')}
                        style={{
                            justifyContent: 'flex-start', padding: '0.875rem 1.1rem',
                            fontSize: '0.9rem', gap: '0.875rem', borderRadius: 'var(--radius-md)'
                        }}
                    >
                        <div style={{
                            width: 26, height: 26, borderRadius: 6,
                            background: 'linear-gradient(135deg, #909098, #d0d0d8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Wallet size={14} color="#0a0a0b" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>WalletConnect</div>
                            <div className="text-xs text-muted">{m.mobileWallet}</div>
                        </div>
                    </button>
                </div>

                <div style={{
                    marginTop: '1.1rem', padding: '0.65rem 0.875rem',
                    background: 'rgba(255,255,255,0.025)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p className="text-xs text-muted text-center font-mono">
                        {m.disclaimer}
                    </p>
                </div>
            </div>
        </div>
    );
}
