# Arcdex — Decentralized Stablecoin FX Exchange on Arc Network  

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/YOUR_DISCORD_ID?color=5865F2&label=Discord&logo=discord)](https://discord.com/invite/buildonarc)
[![Twitter](https://img.shields.io/twitter/follow/arc_network?style=social)](https://x.com/arc_network)
[![GitHub Stars](https://img.shields.io/github/stars/arc-network/arc-ecosystem?style=social)](https://github.com/arc-network)
[![Docs](https://img.shields.io/badge/Docs-Arc%20Network-blue)](https://docs.arc.network/)

---

> A next-generation, non-custodial stablecoin DEX built natively on the Arc Testnet. Swap USDC ↔ EURC with zero slippage, gasless Permit2 authorization, and a built-in points & referral system — all in a clean, bilingual (EN/TR) interface.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Components](#pages--components)
- [How It Works](#how-it-works)
- [Points & Gamification System](#points--gamification-system)
- [Bilingual Support](#bilingual-support)
- [Smart Contracts & Network](#smart-contracts--network)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Environment & Configuration](#environment--configuration)
- [ERC-8004 AI Agent Registry](#erc-8004-ai-agent-registry)

---

## Overview

**Arcdex** is a decentralized exchange (DEX) focused exclusively on stablecoin FX trading. Unlike traditional AMM-based DEXes, Arcdex uses Arc Network's native FX engine to provide **deterministic exchange rates** — meaning no impermanent loss, no price impact, and no order books.

The protocol leverages **Permit2** (Uniswap's universal token authorization standard) to allow users to authorize swaps with an off-chain signature instead of an on-chain `approve()` transaction — saving gas and improving UX significantly.

The platform is live on **Arc Testnet** (Chain ID: `5042002`) and is completely non-custodial. Users retain full control of their funds at all times.

---

## Live Demo

> Deployed via Vercel. The app connects to Arc Testnet automatically via MetaMask or WalletConnect.

Get testnet tokens from the built-in **Faucet** page (redirects to Circle's official faucet) before trading.

---

## Features

### Swap
- **USDC ↔ EURC** swaps at a fixed deterministic rate (1 USDC = 0.92 EURC)
- One-click swap flow — no separate `approve()` transaction needed
- Gasless authorization via **Permit2** EIP-712 typed data signing
- Real-time balance display with auto-refresh
- Progress bar with step-by-step status during swap execution
- 25% / 50% / 75% / MAX percentage shortcuts
- Token flip (reverse swap direction)
- Success animation: confetti + sound effect on confirmed swap
- Transaction history in collapsible **Activity Feed** with block explorer links

### Liquidity Pool
- Deposit USDC or EURC into Arc Escrow to provide liquidity for swaps
- Withdraw deposited liquidity at any time
- Live pool depth stats (USDC & EURC balances in escrow)
- Range slider + percentage chips for easy amount selection
- LP balance tracking per wallet

### Leaderboard & Points
- Real-time on-chain style leaderboard (sorted by total points)
- Points earned from: trading volume, daily check-in streaks, referrals
- Top 100 wallets displayed with rank icons (gold, silver, bronze medals)
- Wallet address shortening (`0x1234···abcd`)
- Your rank highlighted in the table

### Daily Check-in
- 7-day streak system with escalating rewards:
  | Day | Points |
  |-----|--------|
  | 1   | +10    |
  | 2   | +20    |
  | 3   | +30    |
  | 4   | +40    |
  | 5   | +50    |
  | 6   | +70    |
  | 7   | +100   |
- Miss a day → streak resets to Day 1
- Visual 7-tile progress bar showing completed days
- One claim per calendar day, enforced via `localStorage`

### Referral System
- Every connected wallet gets a unique referral code (`ARCXXXXXX`)
- Share your code with friends — both parties earn **+500 points**
- One-time use per wallet (can't refer yourself)
- Code entry form with instant feedback

### Bridge
- Bridge **USDC** between **Ethereum Sepolia** and **Arc Testnet** using Circle's Cross-Chain Transfer Protocol (CCTP)
- Powered by `@circle-fin/bridge-kit` — gasless Circle Bridge integration
- Step-by-step flow: Switch network → Approve → Burn on source chain → Mint on destination chain
- Live status updates for each bridge step (switching, approving, signing, waiting for attestation)
- Transaction history saved to `localStorage` with explorer links for both source and destination tx
- Balance display for the source chain token before bridging
- Bidirectional: **Sepolia → Arc** and **Arc → Sepolia**

### AI Agent Registry (ERC-8004)
- Register AI agents with onchain identity NFTs using the **ERC-8004** standard on Arc Testnet
- Three fully onchain operations:
  - **Register**: Mint an identity NFT for your AI agent with a custom or default IPFS metadata URI
  - **Reputation Feedback**: Record onchain feedback scores (0–100) for any registered agent with categorized tags
  - **Validation Request**: Submit credential verification requests to a chosen validator address
- Automatically detects if the connected wallet already has a registered agent
- Shows agent ID, metadata URI, and links to the Arc block explorer
- Per ERC-8004 spec: agent owners cannot submit feedback for their own agents
- Uses `viem` for all read operations and `ethers.js` for write transactions

### Faucet
- Step-by-step guide to get testnet USDC from Circle's official faucet
- Direct link to `faucet.circle.com`
- 5-step visual walkthrough

### Wallet Connection
- **MetaMask** (browser extension)
- **WalletConnect** (mobile & multi-wallet)
- Auto network switch to Arc Testnet, or prompts to add it if not found
- Wallet modal with clean UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Blockchain (write) | ethers.js v6 |
| Blockchain (read) | viem v2 |
| Bridge | @circle-fin/bridge-kit + @circle-fin/adapter-viem-v2 |
| Icons | lucide-react |
| Styling | Custom CSS (CSS Variables, no Tailwind) |
| State | React Context API |
| Persistence | localStorage |
| Backend/Relayer | Vercel Serverless Function (`/api/execute-swap`) |
| Deployment | Vercel |
| Network | Arc Testnet (Chain ID: 5042002) |

---

## Project Structure

```
arc-dex/
├── api/
│   └── execute-swap.js          # Vercel serverless relayer — submits swap tx on-chain
├── src/
│   ├── main.jsx                 # App entry point, context providers
│   ├── App.jsx                  # Route definitions
│   ├── index.css                # Global styles, CSS variables, component classes
│   │
│   ├── context/
│   │   ├── WalletContext.jsx    # Wallet connection, balances, signer
│   │   ├── PointsContext.jsx    # Points, streaks, referrals, leaderboard
│   │   └── LangContext.jsx      # EN/TR i18n — all UI strings
│   │
│   ├── components/
│   │   ├── Navbar.jsx           # Navigation, wallet button, language toggle
│   │   ├── SwapCard.jsx         # Main swap widget (from/to inputs, flip, execute)
│   │   ├── ActivityFeed.jsx     # Collapsible recent transactions list
│   │   ├── NotificationModal.jsx # Reusable confirm/alert modal
│   │   └── WalletModal.jsx      # MetaMask / WalletConnect connection modal
│   │
│   ├── hooks/
│   │   ├── useBridgeKit.js      # Circle BridgeKit hook — USDC cross-chain bridge
│   │   └── useAgentRegistry.js  # ERC-8004 hook — register, reputation, validation
│   │
│   ├── pages/
│   │   ├── Landing.jsx          # Homepage with hero, features, how it works
│   │   ├── Swap.jsx             # Swap page with SwapCard + points panel
│   │   ├── Liquidity.jsx        # Pool management (deposit/withdraw)
│   │   ├── Bridge.jsx           # USDC cross-chain bridge (Sepolia ↔ Arc Testnet)
│   │   ├── Agent.jsx            # ERC-8004 AI Agent Registry page
│   │   ├── Faucet.jsx           # Faucet guide page
│   │   └── Leaderboard.jsx      # Points leaderboard + daily check-in + referral
│   │
│   └── utils/
│       ├── permit2.js           # Permit2 allowance check, approve, EIP-712 signing
│       ├── backend.js           # Fetch wrapper for /api/execute-swap relayer
│       └── network.js           # Auto-add/switch to Arc Testnet in MetaMask
│
├── index.html
├── vite.config.js
├── vercel.json                  # SPA rewrite rules + API routing
└── package.json
```

---

## Pages & Components

### `Landing.jsx`
The marketing homepage. Features a typewriter hero animation cycling through phrases ("FX Trading made Super Easy.", "FX Trading with Zero Slippage.", etc.), a 6-card feature grid, and a "How It Works" explanation card. All text is fully bilingual.

### `Swap.jsx`
The core trading page. Renders `SwapCard` for the swap widget and a sidebar points panel (total points, daily streak, quick claim button, referral code entry). Connected to `PointsContext` to award volume points after each successful swap.

### `SwapCard.jsx`
The main swap widget. Handles the full swap lifecycle:
1. Check Permit2 allowance
2. If not approved → prompt wallet setup (one-time `approve(Permit2, MaxUint256)`)
3. Get EIP-712 signature from user wallet (no gas)
4. POST to `/api/execute-swap` (relayer submits the on-chain transaction)
5. Update balances, award points, log activity, fire confetti

### `Liquidity.jsx`
Pool management page. Reads live USDC/EURC balances in the escrow contract via `JsonRpcProvider`. Handles `approve()` + `depositLiquidity()` / `withdrawLiquidity()` flows with the FX Escrow contract. Tracks LP activity in localStorage.

### `Leaderboard.jsx`
Three-section page:
- **User stats card** — your wallet, rank, and breakdown of volume/streak/referral points
- **Daily check-in card** — 7-day visual progress + claim button
- **Referral system card** — your code (with copy button) + enter a friend's code
- **Top 100 table** — real-time sorted leaderboard

### `LangContext.jsx`
Custom i18n system. Supports **English** and **Turkish**. Uses an `interpolate()` function for dynamic values (`{pts}`, `{streak}`, `{rank}`, etc.). Language preference is persisted to `localStorage`. The `tr()` function is wrapped in `useCallback([lang])` so all components re-render when language changes.

### `PointsContext.jsx`
Global state for the gamification system. Stores everything in `localStorage`:
- `points` — total point balance
- `streak` — current day streak (1–7)
- `lastClaimDate` — prevents double-claiming on same calendar day
- `referralCode` — auto-generated unique code per wallet
- `usedReferral` — tracks if wallet has already used a referral code
- `leaderboard` — sorted array of `{ address, totalPoints }` objects
- `volumePoints`, `streakPoints`, `referralPoints` — broken down by source

### `WalletContext.jsx`
Manages wallet state: connected address, ethers.js `signer`, USDC/EURC balances, MetaMask/WalletConnect provider switching, and the `refreshBalances()` utility used after swaps and liquidity actions.

---

## How It Works

### Swap Flow

```
User enters amount
       │
       ▼
Check Permit2 allowance
       │
   Not approved? ──► One-time approve(Permit2, MaxUint256)
       │
       ▼
User signs EIP-712 PermitTransferFrom message (off-chain, no gas)
       │
       ▼
POST /api/execute-swap  →  Relayer wallet submits tx on Arc Testnet
       │
       ▼
Arc FX Engine settles swap at deterministic rate
       │
       ▼
UI updates balances, awards volume points, logs activity, fires confetti
```

### Permit2 Integration

Arcdex uses [Uniswap's Permit2](https://github.com/Uniswap/permit2) contract (`0x000000000022D473030F116dDEE9F6B43aC78BA3`) for gasless token authorization.

- **One-time setup**: User calls `approve(Permit2, MaxUint256)` on their token — this is the only on-chain approve they ever need.
- **Per-swap**: User signs a `PermitTransferFrom` typed data message specifying the exact token, amount, nonce, and deadline. This signature is sent to the relayer.
- **Relayer**: The backend serverless function takes the signature + permit data and submits the actual swap transaction on behalf of the user.

---

## Points & Gamification System

Points are stored locally per wallet address and synced to a shared leaderboard in `localStorage`.

### Earning Points

| Action | Points |
|--------|--------|
| Swap $1–$99 | +10 pts |
| Swap $100–$499 | +25 pts |
| Swap $500+ | +50 pts |
| Day 1 check-in | +10 pts |
| Day 2 check-in | +20 pts |
| Day 3 check-in | +30 pts |
| Day 4 check-in | +40 pts |
| Day 5 check-in | +50 pts |
| Day 6 check-in | +70 pts |
| Day 7 check-in | +100 pts |
| Referral (both sides) | +500 pts |

### Streak Rules
- Streaks run Day 1 → Day 7 then reset to Day 1
- **Missing a day resets your streak to 0** — the next claim starts at Day 1 again
- Only one claim per calendar day is allowed

---

## Bilingual Support

The entire UI supports **English** and **Turkish** via `LangContext`. Every string in the application is stored in the translation dictionary — no hardcoded text in components.

**Toggle**: Navbar button (EN ↔ TR) — preference saved to `localStorage`.

**Translation keys cover**: all pages (Landing, Swap, Pool, Bridge, Faucet, Leaderboard), all components (SwapCard, ActivityFeed, NotificationModal, WalletModal, Navbar), and all dynamic strings with interpolation (`{pts}`, `{streak}`, `{rank}`, `{day}`, etc.).

To add a new language, add a new key to the `translations` object in `LangContext.jsx` and add a toggle option in `Navbar.jsx`.

---

## Smart Contracts & Network

| Contract | Address |
|----------|---------|
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |
| FX Escrow (Liquidity + Swaps) | `0xf11aA9A07f6fe684BC0495aDAc8797137dd2e7eF` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| ERC-8004 IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ERC-8004 ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

| Network | Value |
|---------|-------|
| Name | Arc Testnet |
| Chain ID | `5042002` |
| RPC URL | `https://rpc.testnet.arc.network` |
| Block Explorer | `https://testnet.arcscan.app` |
| Native Currency | USDC |

The network is automatically added to MetaMask on first connection if not already present.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A browser wallet (MetaMask recommended)

### Installation

```bash
git clone https://github.com/Kewe63/arc-network-dex.git
cd arc-dex
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`.

> **Note:** The `/api/execute-swap` relayer runs as a Vercel Serverless Function. For local development, you can use `vercel dev` (requires Vercel CLI) or mock the endpoint.

### Build

```bash
npm run build
```

Output goes to `/dist`.

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

The project is configured for **Vercel** deployment out of the box.

`vercel.json` handles:
- SPA routing — all non-API routes rewrite to `index.html`
- `/api/*` routes are served as serverless functions from the `/api` directory

```json
{
  "version": 2,
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

**Deploy:**
```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

---

## Environment & Configuration

The relayer (`/api/execute-swap.js`) requires a funded wallet private key to submit transactions on Arc Testnet. Set this as an environment variable in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `RELAYER_PRIVATE_KEY` | Private key of the relayer wallet (must hold USDC on Arc Testnet for gas) |

> Never commit private keys to the repository. Use Vercel's environment variable manager.

---

## License

This project is open source. Feel free to fork, build on, and contribute.

---

<div align="center">
  <strong>Built on Arc Network — The Future of On-Chain FX</strong>
</div>

---

## ERC-8004 AI Agent Registry

Arcdex implements the **ERC-8004** standard — a protocol for registering AI agents with onchain identity, reputation, and credential verification on Arc Testnet.

### Contracts

| Contract | Address |
|----------|---------|
| IdentityRegistry | [`0x8004A818BFB912233c491871b3d84c89A494BD9e`](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |
| ReputationRegistry | [`0x8004B663056A597Dffe9eCcC1965A193B7388713`](https://testnet.arcscan.app/address/0x8004B663056A597Dffe9eCcC1965A193B7388713) |
| ValidationRegistry | [`0x8004Cb1BF31DAf7788923b405b754f57acEB4272`](https://testnet.arcscan.app/address/0x8004Cb1BF31DAf7788923b405b754f57acEB4272) |

### How It Works

**1. Register (`/agent` → Register Agent Identity)**
```
User provides metadata URI (IPFS or HTTPS)
       │
       ▼
IdentityRegistry.register(metadataURI)
       │
       ▼
ERC-721 NFT minted → Agent ID assigned to wallet
```

**2. Reputation Feedback**
```
Reviewer provides: agentId + score (0-100) + tag
       │
       ▼
ReputationRegistry.giveFeedback(agentId, score, category, tag, ...)
       │
       ▼
Feedback recorded onchain (owners cannot review their own agents)
```

**3. Validation Request**
```
Owner provides: agentId + validator address
       │
       ▼
ValidationRegistry.validationRequest(validator, agentId, requestURI, requestHash)
       │
       ▼
Credential verification request sent to chosen validator
```

### Hook: `useAgentRegistry.js`

All onchain interactions are handled by the `useAgentRegistry` hook:
- **Reads** via `viem` `createPublicClient` (no wallet required)
- **Writes** via `ethers.js` `Contract` with the connected signer
- Auto-detects existing agent for the connected wallet via `tokenOfOwnerByIndex` (falls back to Transfer event scan)
- Switches MetaMask to Arc Testnet automatically before any write transaction

---

- Built with ❤️ for the ARC NETWORK community.
