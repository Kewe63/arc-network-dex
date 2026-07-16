import React, { useState, useEffect } from 'react';
import SendCard from '../components/SendCard';
import ActivityFeed from '../components/ActivityFeed';
import { useWallet } from '../context/WalletContext';
import { useLang } from '../context/LangContext';

export default function Send() {
    const { address, isConnected } = useWallet();
    const { tr } = useLang();
    const [activities, setActivities] = useState([]);

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
                <h1 className="page-title silver-text">{tr('sendTitle')}</h1>
                <p className="page-subtitle">
                    {tr('sendSubtitle')}
                </p>
            </div>

            <SendCard onActivityAdd={handleActivityAdd} />
            <ActivityFeed activities={activities} />
        </div>
    );
}
