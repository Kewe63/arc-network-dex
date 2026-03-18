import React, { createContext, useContext, useState, useCallback } from 'react';

const LangContext = createContext();
export const useLang = () => useContext(LangContext);

const translations = {
    en: {
        // Navbar
        connectWallet: 'Connect Wallet',
        disconnect: 'Disconnect',

        // Swap page — points panel
        totalPoints: 'Total Points',
        dailyStreak: 'Daily Streak',
        claimDaily: 'Claim Daily (+{pts} pts)',
        claimedToday: 'Claimed today ✓',
        alreadyClaimed: 'Already claimed today!',
        claimSuccess: '+{pts} pts earned! (Day {streak})',
        enterReferral: 'Enter Referral Code',
        referralUsed: 'Referral code applied: {code}',
        referralHint: "Enter a friend's referral code — you both earn <strong>500 pts</strong>. (One-time only)",
        apply: 'Apply',
        referralApplied: 'Applied! +500 pts earned.',
        error: 'An error occurred.',

        // SwapCard
        youPay: 'You pay',
        youReceive: 'You receive',
        balance: 'Balance:',
        exchangeRate: 'Exchange Rate',
        connectToSwap: 'Connect Wallet to Swap',
        setupWallet: 'Setup Wallet (One-time)',
        oneClickSwap: 'One-Click Swap',
        cancel: 'Cancel',
        approve: 'Approve',

        // ActivityFeed
        recentActivity: 'Recent Activity',
        viewOnExplorer: 'View on Explorer',
        prev: '← Prev',
        next: 'Next →',

        // Leaderboard
        lbSubtitle: 'Check in daily, invite friends, and climb the ranks.',
        yourWallet: 'Your Wallet',
        yourRank: 'Rank: #{rank}',
        volumePts: 'Volume Pts',
        streakPts: 'Streak Pts',
        referralPts: 'Referral Pts',
        dailyStreakLabel: 'Daily Streak',

        // Check-in card
        dailyCheckin: 'Daily Check-in',
        dayLabel: 'Day {n}',
        checkinBtn: 'Check-in (+{pts} pts)',
        checkinDone: 'Checked in today',
        tomorrow: 'Tomorrow: Day {day} → +{pts} pts',

        // Referral card
        referralSystem: 'Referral System',
        yourCode: 'Your Referral Code',
        copy: 'Copy',
        referralShareHint: 'If a friend uses your code, you both earn <strong>500 pts</strong>.',
        enterCode: 'Enter a Code',
        refSuccess: '+500 pts earned!',

        // Leaderboard table
        top100: 'Top 100',
        rankCol: 'RANK',
        walletCol: 'WALLET',
        pointsCol: 'POINTS',
        noEntries: 'No wallets yet. Be the first!',
        connectToSee: 'Connect your wallet to see the leaderboard and earn points.',
        you: 'You',

        // WalletModal
        modalTitle: 'Connect Wallet',
        modalSubtitle: 'Choose your preferred wallet',
        browserWallet: 'Browser extension wallet',
        mobileWallet: 'Mobile & multi-wallet',
        disclaimer: 'Testnet app — no real funds involved.',

        // Landing
        heroSubtitle: 'Next-gen decentralized stablecoin FX platform built natively on Arc Network. Instant, low-cost swaps between USDC and EURC — no bridges, no wrapped tokens.',
        launchApp: 'Launch App',
        addLiquidity: 'Add Liquidity',
        whyArcdex: 'Why Arcdex?',
        whySubtitle: 'Built for speed, security, and simplicity.',
        howItWorks: 'How It Works',
        howItWorksBody: "Arcdex connects directly to Arc Network's native FX engine. When you initiate a swap, the protocol signs a Permit2 authorization off-chain (no gas), then a relayer executes the settlement on-chain. No order books, no AMM impermanent loss — just deterministic FX rates.",
        startTrading: 'Start Trading',
        feat0Title: 'Zero Slippage',
        feat0Desc: 'Deterministic FX rates — no AMM impermanent loss.',
        feat1Title: 'Non-Custodial',
        feat1Desc: 'Your keys, your coins. Gasless via Permit2 signing.',
        feat2Title: 'Near-Zero Fees',
        feat2Desc: 'Pay gas in USDC. Lightning-fast Arc Network.',
        feat3Title: 'Cross-Chain',
        feat3Desc: 'Bridge stablecoins from any chain seamlessly.',
        feat4Title: 'Secure',
        feat4Desc: 'Audited smart contracts. Permit2 authorization.',
        feat5Title: 'Earn Yield',
        feat5Desc: 'Provide liquidity and earn from swap fees.',
        phrase0Prefix: 'FX Trading made',
        phrase0Text: 'Super Easy.',
        phrase1Prefix: 'FX Trading with',
        phrase1Text: 'Zero Slippage.',
        phrase2Prefix: 'FX Trading at',
        phrase2Text: 'Lightning Speed.',
        phrase3Prefix: 'FX Trading with',
        phrase3Text: 'Gas Optimized.',

        // Bridge
        bridgeSubtitle: 'Move stablecoins seamlessly across chains.',
        comingSoon: 'COMING SOON',
        bridgeBody: 'Users will soon be able to bridge USDC directly from Ethereum, Arbitrum, Base, and other networks to the Arc testnet — in just a few clicks.',
        bridgeHint: 'In the meantime, use the faucet to get testnet tokens and start trading on the Swap page.',
        goToSwap: 'Go to Swap',
        getTestnetTokens: 'Get Testnet Tokens',

        // Faucet
        faucetTitle: 'Fuel Your Wallet',
        faucetSubtitle: 'Arc DEX runs on the Arc Testnet. You need testnet USDC to pay for gas and trade.',
        faucetBody: 'Use the official Circle Faucet to receive testnet USDC directly to your wallet. Then come back and start trading instantly.',
        openFaucet: 'Open Circle Faucet',
        quickSteps: 'Quick Steps',
        faucetStep0: 'Visit faucet.circle.com',
        faucetStep1: 'Connect your MetaMask wallet',
        faucetStep2: 'Select "Arc Testnet" as the network',
        faucetStep3: 'Request testnet USDC',
        faucetStep4: 'Return here and start swapping!',

        // Liquidity / Pool
        poolTitle: 'Pool Depth',
        poolSubtitle: 'Provide liquidity to earn from swap fees and keep the pool deep.',
        poolInfoBanner: 'Add assets to the Arc Escrow to facilitate cross-chain stablecoin swaps.',
        globalPool: 'Global Pool',
        totalLiquidity: 'Total liquidity available in the Arc Escrow for swapping.',
        manageAssets: 'Manage Assets',
        amountLabel: 'Amount',
        walletLabel: 'Wallet:',
        depositedLabel: 'Deposited:',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        processing: 'Processing...',
        connectToManage: 'Connect wallet to manage liquidity.',
        lowPoolDepth: 'Low pool depth causes trades to fail. Consider adding liquidity.',
        liquidityProvision: 'Liquidity Provision:',
        rank: 'RANK',
        wallet: 'WALLET',
        points: 'POINTS',
    },
    tr: {
        // Navbar
        connectWallet: 'Cüzdan Bağla',
        disconnect: 'Bağlantıyı Kes',

        // Swap page — points panel
        totalPoints: 'Toplam Puan',
        dailyStreak: 'Günlük Seri',
        claimDaily: 'Günlük Al (+{pts} puan)',
        claimedToday: 'Bugün alındı ✓',
        alreadyClaimed: 'Bugünkü puanı zaten aldın!',
        claimSuccess: '+{pts} puan kazandın! ({streak}. gün)',
        enterReferral: 'Referans Kodu Gir',
        referralUsed: 'Referans kodu kullanıldı: {code}',
        referralHint: 'Arkadaşının referans kodunu gir — ikiniz de <strong>500 puan</strong> kazanırsınız. (Sadece bir kez)',
        apply: 'Uygula',
        referralApplied: 'Uygulandı! +500 puan kazandın.',
        error: 'Hata oluştu.',

        // SwapCard
        youPay: 'Gönderiyorsun',
        youReceive: 'Alıyorsun',
        balance: 'Bakiye:',
        exchangeRate: 'Kur',
        connectToSwap: 'Cüzdan Bağla',
        setupWallet: 'Cüzdanı Kur (Bir kez)',
        oneClickSwap: 'Tek Tıkla Swap',
        cancel: 'İptal',
        approve: 'Onayla',

        // ActivityFeed
        recentActivity: 'Son İşlemler',
        viewOnExplorer: "Explorer'da Gör",
        prev: '← Önceki',
        next: 'Sonraki →',

        // Leaderboard
        lbSubtitle: 'Günlük check-in yap, arkadaşlarını davet et ve sıralamada yüksel.',
        yourWallet: 'Cüzdanın',
        yourRank: 'Sıralaman: #{rank}',
        volumePts: 'Hacim Puanı',
        streakPts: 'Streak Puanı',
        referralPts: 'Referans Puanı',
        dailyStreakLabel: 'Günlük Seri',

        // Check-in card
        dailyCheckin: 'Günlük Check-in',
        dayLabel: 'Gün {n}',
        checkinBtn: 'Check-in Yap (+{pts} puan)',
        checkinDone: 'Bugün check-in yapıldı',
        tomorrow: 'Yarın: Gün {day} → +{pts} puan',

        // Referral card
        referralSystem: 'Referans Sistemi',
        yourCode: 'Referans Kodun',
        copy: 'Kopyala',
        referralShareHint: 'Arkadaşın bu kodu kullanırsa ikiniz de <strong>500 puan</strong> kazanır.',
        enterCode: 'Kod Gir',
        refSuccess: '+500 puan kazandın!',

        // Leaderboard table
        top100: 'İlk 100',
        rankCol: 'SIRA',
        walletCol: 'CÜZDAN',
        pointsCol: 'PUAN',
        noEntries: 'Henüz kimse yok. İlk sen ol!',
        connectToSee: 'Sıralamayı görmek için cüzdanını bağla.',
        you: 'Sen',

        // WalletModal
        modalTitle: 'Cüzdan Bağla',
        modalSubtitle: 'Tercih ettiğin cüzdanı seç',
        browserWallet: 'Tarayıcı uzantısı',
        mobileWallet: 'Mobil & çoklu cüzdan',
        disclaimer: 'Testnet uygulaması — gerçek para içermez.',

        // Landing
        heroSubtitle: 'Arc Network üzerinde geliştirilen yeni nesil merkezi olmayan stablecoin FX platformu. USDC ve EURC arasında anında, düşük maliyetli takaslar — köprü yok, sarılmış token yok.',
        launchApp: 'Uygulamayı Aç',
        addLiquidity: 'Likidite Ekle',
        whyArcdex: 'Neden Arcdex?',
        whySubtitle: 'Hız, güvenlik ve sadelik için tasarlandı.',
        howItWorks: 'Nasıl Çalışır?',
        howItWorksBody: "Arcdex, Arc Network'ün yerel FX motoruna doğrudan bağlanır. Bir takas başlattığınızda, protokol zincir dışında Permit2 yetkilendirmesi imzalar (gaz yok), ardından bir röle zincir üzerinde uzlaşmayı gerçekleştirir. Emir defteri yok, AMM kalıcı kaybı yok — sadece deterministik FX kurları.",
        startTrading: 'Ticarete Başla',
        feat0Title: 'Sıfır Kayma',
        feat0Desc: 'Deterministik FX kurları — AMM kalıcı kaybı yok.',
        feat1Title: 'Saklama Gerektirmez',
        feat1Desc: 'Anahtarların senin, coinlerin senin. Permit2 ile gassız.',
        feat2Title: 'Çok Düşük Ücretler',
        feat2Desc: 'Gazı USDC ile öde. Şimşek hızında Arc Network.',
        feat3Title: 'Zincirler Arası',
        feat3Desc: 'Stablecoinleri zincirler arasında sorunsuzca köprüle.',
        feat4Title: 'Güvenli',
        feat4Desc: 'Denetlenmiş akıllı sözleşmeler. Permit2 yetkilendirmesi.',
        feat5Title: 'Getiri Kazan',
        feat5Desc: 'Likidite sağla ve takas ücretlerinden kazan.',
        phrase0Prefix: 'FX Ticareti artık',
        phrase0Text: 'Çok Kolay.',
        phrase1Prefix: 'FX Ticareti ile',
        phrase1Text: 'Sıfır Kayma.',
        phrase2Prefix: 'FX Ticareti',
        phrase2Text: 'Işık Hızında.',
        phrase3Prefix: 'FX Ticareti ile',
        phrase3Text: 'Optimize Gas.',

        // Bridge
        bridgeSubtitle: 'Stablecoinleri zincirler arasında sorunsuzca taşı.',
        comingSoon: 'YAKINDA',
        bridgeBody: 'Kullanıcılar yakında USDC\'yi Ethereum, Arbitrum, Base ve diğer ağlardan Arc testnet\'e yalnızca birkaç tıklamayla köprüleyebilecek.',
        bridgeHint: 'Bu arada, testnet tokenleri almak için faucet\'i kullan ve Swap sayfasında işlem yapmaya başla.',
        goToSwap: 'Swap\'a Git',
        getTestnetTokens: 'Testnet Tokeni Al',

        // Faucet
        faucetTitle: 'Cüzdanını Doldur',
        faucetSubtitle: 'Arc DEX, Arc Testnet üzerinde çalışır. Gaz için ve işlem yapmak üzere testnet USDC\'ye ihtiyacın var.',
        faucetBody: 'Testnet USDC\'yi doğrudan cüzdanına almak için resmi Circle Faucet\'i kullan. Sonra geri dön ve anında işlem yapmaya başla.',
        openFaucet: 'Circle Faucet\'i Aç',
        quickSteps: 'Hızlı Adımlar',
        faucetStep0: 'faucet.circle.com\'u ziyaret et',
        faucetStep1: 'MetaMask cüzdanını bağla',
        faucetStep2: '"Arc Testnet"i ağ olarak seç',
        faucetStep3: 'Testnet USDC talep et',
        faucetStep4: 'Buraya geri dön ve takas yapmaya başla!',

        // Liquidity / Pool
        poolTitle: 'Havuz Derinliği',
        poolSubtitle: 'Takas ücretlerinden kazanmak ve havuzu derin tutmak için likidite sağla.',
        poolInfoBanner: 'Zincirler arası stablecoin takaslarını kolaylaştırmak için Arc Escrow\'a varlık ekle.',
        globalPool: 'Global Havuz',
        totalLiquidity: 'Arc Escrow\'da takas için mevcut toplam likidite.',
        manageAssets: 'Varlıkları Yönet',
        amountLabel: 'Miktar',
        walletLabel: 'Cüzdan:',
        depositedLabel: 'Yatırılan:',
        deposit: 'Yatır',
        withdraw: 'Çek',
        processing: 'İşleniyor...',
        connectToManage: 'Likiditeyi yönetmek için cüzdanını bağla.',
        lowPoolDepth: 'Düşük havuz derinliği işlemlerin başarısız olmasına neden olur. Likidite eklemeyi düşün.',
        liquidityProvision: 'Likidite Sağlama:',
        rank: 'SIRA',
        wallet: 'CÜZDAN',
        points: 'PUAN',
    },
};

function interpolate(template, vars = {}) {
    if (!template) return '';
    return Object.entries(vars).reduce(
        (s, [k, v]) => s.split(`{${k}}`).join(String(v)),
        template
    );
}

export function LangProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try { return localStorage.getItem('arc-lang') || 'en'; } catch { return 'en'; }
    });

    const setLang = useCallback((l) => {
        setLangState(l);
        try { localStorage.setItem('arc-lang', l); } catch {}
    }, []);

    const tr = useCallback((key, vars) => {
        const dict = translations[lang] ?? translations.en;
        const tpl = dict[key] ?? translations.en[key] ?? key;
        return interpolate(tpl, vars);
    }, [lang]);

    return (
        <LangContext.Provider value={{ lang, setLang, tr }}>
            {children}
        </LangContext.Provider>
    );
}
