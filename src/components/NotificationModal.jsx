import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function NotificationModal({ isOpen, onClose, title, message, onConfirm, confirmText, cancelText, type = "info" }) {
    const { tr } = useLang();
    if (!isOpen) return null;

    const isSuccess = title?.toLowerCase().includes('success');
    const isDanger = type === 'danger';

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <div className="flex items-center gap-1">
                        <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: isSuccess ? 'rgba(74,222,128,0.1)' : isDanger ? 'rgba(248,113,113,0.1)' : 'rgba(200,200,210,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${isSuccess ? 'rgba(74,222,128,0.2)' : isDanger ? 'rgba(248,113,113,0.2)' : 'var(--border-silver)'}`
                        }}>
                            {isSuccess
                                ? <CheckCircle size={16} color="#4ade80" />
                                : <AlertCircle size={16} color={isDanger ? '#f87171' : 'var(--silver-300)'} />
                            }
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">
                        <X size={15} />
                    </button>
                </div>

                <div className="font-mono" style={{
                    fontSize: '0.82rem', lineHeight: 1.75,
                    color: 'var(--text-secondary)', marginBottom: '1.25rem'
                }}>
                    {message}
                </div>

                <div className="flex gap-1">
                    <button className="btn btn-ghost w-full" onClick={onClose} style={{ flex: 1 }}>
                        {cancelText || tr('cancel')}
                    </button>
                    <button
                        className={`btn w-full ${isSuccess ? 'btn-success' : isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
                        style={{ flex: 1.5 }}
                    >
                        {confirmText || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
