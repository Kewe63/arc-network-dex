import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PointsContext = createContext();
export const usePoints = () => useContext(PointsContext);

const STREAK_REWARDS = [0, 10, 20, 30, 40, 50, 70, 100]; // index 1-7
const REFERRAL_BONUS = 500;

function getStorageKey(address) {
    return `arc_points_${address.toLowerCase()}`;
}

function loadData(address) {
    if (!address) return null;
    try {
        const raw = localStorage.getItem(getStorageKey(address));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveData(address, data) {
    if (!address) return;
    localStorage.setItem(getStorageKey(address), JSON.stringify(data));
}

function defaultData(address) {
    return {
        address,
        totalPoints: 0,
        volumePoints: 0,
        streakPoints: 0,
        referralPoints: 0,
        streak: 0,
        lastLoginDate: null,       // "YYYY-MM-DD"
        referralCode: generateCode(address),
        referredBy: null,
        referralUsedAddresses: [], // addresses this user referred
        history: [],               // { type, pts, desc, ts }
    };
}

function generateCode(address) {
    if (!address) return '';
    // deterministic short code from address
    return 'ARC' + address.slice(2, 8).toUpperCase();
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
    // a, b are "YYYY-MM-DD" strings
    const msA = new Date(a).getTime();
    const msB = new Date(b).getTime();
    return Math.round((msB - msA) / 86400000);
}

// Global leaderboard: stored separately, keyed by address
function loadLeaderboard() {
    try {
        const raw = localStorage.getItem('arc_leaderboard');
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveLeaderboard(board) {
    localStorage.setItem('arc_leaderboard', JSON.stringify(board));
}

function updateLeaderboard(address, totalPoints, referralCode) {
    if (!address) return;
    const board = loadLeaderboard();
    board[address.toLowerCase()] = {
        address,
        totalPoints,
        referralCode,
        updatedAt: Date.now(),
    };
    saveLeaderboard(board);
}

export function PointsProvider({ children }) {
    const [address, setAddress] = useState(null);
    const [data, setData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);

    // Called by App when wallet connects/disconnects
    const initPoints = useCallback((walletAddress) => {
        if (!walletAddress) {
            setAddress(null);
            setData(null);
            refreshLeaderboard();
            return;
        }
        setAddress(walletAddress);
        const saved = loadData(walletAddress) || defaultData(walletAddress);
        // Ensure referralCode exists for older saves
        if (!saved.referralCode) saved.referralCode = generateCode(walletAddress);
        setData(saved);
        refreshLeaderboard();
    }, []);

    const refreshLeaderboard = useCallback(() => {
        const board = loadLeaderboard();
        const sorted = Object.values(board)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 100);
        setLeaderboard(sorted);
    }, []);

    // Persist + sync leaderboard whenever data changes
    const persist = useCallback((newData) => {
        if (!newData?.address) return;
        saveData(newData.address, newData);
        updateLeaderboard(newData.address, newData.totalPoints, newData.referralCode);
        setData(newData);
        refreshLeaderboard();
    }, [refreshLeaderboard]);

    // ── DAILY LOGIN STREAK ──────────────────────────────────────────
    const claimDailyLogin = useCallback(() => {
        if (!data) return { claimed: false };
        const today = todayStr();
        if (data.lastLoginDate === today) return { claimed: false, alreadyClaimed: true };

        let newStreak = 1;
        if (data.lastLoginDate) {
            const diff = daysBetween(data.lastLoginDate, today);
            if (diff === 1) {
                // consecutive day
                newStreak = (data.streak % 7) + 1;
            } else {
                // missed a day — reset
                newStreak = 1;
            }
        }

        const pts = STREAK_REWARDS[newStreak];
        const newData = {
            ...data,
            streak: newStreak,
            lastLoginDate: today,
            totalPoints: data.totalPoints + pts,
            streakPoints: data.streakPoints + pts,
            history: [
                { type: 'streak', pts, desc: `Day ${newStreak}`, ts: Date.now() },
                ...data.history,
            ].slice(0, 200),
        };
        persist(newData);
        return { claimed: true, streak: newStreak, pts };
    }, [data, persist]);

    // ── VOLUME POINTS (called after swap) ──────────────────────────
    // 1 point per 1 USD of volume (fromAmount in USDC/EURC both ~$1)
    const addVolumePoints = useCallback((amountStr, fromToken, toToken) => {
        if (!data) return;
        const volume = parseFloat(amountStr) || 0;
        if (volume <= 0) return;
        const pts = Math.floor(volume); // 1 pt per $1
        if (pts <= 0) return;
        const newData = {
            ...data,
            totalPoints: data.totalPoints + pts,
            volumePoints: data.volumePoints + pts,
            history: [
                { type: 'swap', pts, desc: `Swapped ${parseFloat(amountStr).toFixed(2)} ${fromToken} → ${toToken}`, ts: Date.now() },
                ...data.history,
            ].slice(0, 200),
        };
        persist(newData);
    }, [data, persist]);

    // ── REFERRAL SYSTEM ─────────────────────────────────────────────
    // Returns { success, error }
    const applyReferralCode = useCallback((code) => {
        if (!data) return { success: false, error: 'Not connected' };
        if (data.referredBy) return { success: false, error: 'Already used a referral code' };
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode === data.referralCode) return { success: false, error: 'Cannot use your own code' };

        // Find referrer in leaderboard
        const board = loadLeaderboard();
        const referrer = Object.values(board).find(
            e => e.referralCode === cleanCode
        );
        if (!referrer) return { success: false, error: 'Invalid referral code' };

        // Give 100 pts to this user
        const myNewData = {
            ...data,
            referredBy: cleanCode,
            totalPoints: data.totalPoints + REFERRAL_BONUS,
            referralPoints: data.referralPoints + REFERRAL_BONUS,
            history: [
                { type: 'referral', pts: REFERRAL_BONUS, desc: `Used referral code ${cleanCode}`, ts: Date.now() },
                ...data.history,
            ].slice(0, 200),
        };
        persist(myNewData);

        // Give 100 pts to referrer
        const referrerData = loadData(referrer.address);
        if (referrerData) {
            // Prevent double-rewarding same referee
            if (!referrerData.referralUsedAddresses.includes(data.address.toLowerCase())) {
                const refNewData = {
                    ...referrerData,
                    totalPoints: referrerData.totalPoints + REFERRAL_BONUS,
                    referralPoints: referrerData.referralPoints + REFERRAL_BONUS,
                    referralUsedAddresses: [
                        ...referrerData.referralUsedAddresses,
                        data.address.toLowerCase(),
                    ],
                    history: [
                        { type: 'referral', pts: REFERRAL_BONUS, desc: `${data.address.slice(0, 8)}… used your code`, ts: Date.now() },
                        ...referrerData.history,
                    ].slice(0, 200),
                };
                saveData(referrer.address, refNewData);
                updateLeaderboard(referrer.address, refNewData.totalPoints, referrer.referralCode);
            }
        }

        refreshLeaderboard();
        return { success: true };
    }, [data, persist, refreshLeaderboard]);

    // ── COMPUTED ─────────────────────────────────────────────────────
    const nextStreakDay = data ? (data.streak % 7) + 1 : 1;
    const nextStreakPts = STREAK_REWARDS[nextStreakDay];
    const canClaimToday = data
        ? data.lastLoginDate !== todayStr()
        : false;

    return (
        <PointsContext.Provider value={{
            // state
            points: data?.totalPoints ?? 0,
            volumePoints: data?.volumePoints ?? 0,
            streakPoints: data?.streakPoints ?? 0,
            referralPoints: data?.referralPoints ?? 0,
            streak: data?.streak ?? 0,
            lastLoginDate: data?.lastLoginDate ?? null,
            referralCode: data?.referralCode ?? '',
            referredBy: data?.referredBy ?? null,
            history: data?.history ?? [],
            canClaimToday,
            nextStreakDay,
            nextStreakPts,
            leaderboard,
            // actions
            initPoints,
            claimDailyLogin,
            addVolumePoints,
            applyReferralCode,
            refreshLeaderboard,
            STREAK_REWARDS,
        }}>
            {children}
        </PointsContext.Provider>
    );
}
