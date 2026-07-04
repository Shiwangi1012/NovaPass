# Decentralized Subscription & Content Access Pass

> A Stellar-powered subscription flow where users connect a wallet, mint a time-locked pass, and unlock premium content without middlemen.

This project demonstrates a complete subscription UX built on Soroban smart contracts and a React frontend. The design focuses on clarity:

1. Connect a Freighter wallet.
2. See the current XLM balance and on-chain access status.
3. Subscribe for a chosen duration by signing one transaction.
4. Unlock premium content instantly when the contract verifies the pass.
5. Let expiry happen automatically on-chain when the pass runs out.

## Why this exists

- No middlemen: creators keep the direct relationship with fans.
- Economical micro-subscriptions: Stellar fees make short passes practical.
- No surprise renewals: the access pass is one-time and time-locked.
- Universal access: any app can verify the same on-chain entitlement.

## How the app works

### Wallet connection

The user clicks **Connect Wallet** and approves the session in Freighter.

### Dashboard overview

After connecting, the app shows:

- Live XLM balance.
- Subscription pass status.
- Content gate status.
- A clear step-by-step journey.

### Purchasing access

If the user is not active, they enter a duration in days and sign the subscribe transaction. The contract mints a time-locked access pass on Stellar.

### Instant verification

The dashboard refreshes immediately after the transaction and the access state flips to active if the pass is valid.

### Content gating

The premium section is visually locked until the `ContentGateContract` confirms the wallet has access through the `SubscriptionContract`.

### Automatic expiry

When the time period ends, the blockchain marks the pass inactive automatically. No manual cancellation is needed.

## Tech stack

- React 19 + TypeScript + Vite
- Stellar SDK
- Freighter wallet integration
- Soroban smart contracts

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment

The frontend expects these variables:

```env
VITE_SUBSCRIPTION_CONTRACT_ID=CD6SWQZYNCJ2GX7LUGFGXEENO7WCQLNHLFUZNBRNC5GWSUL7FRIBAIWE
VITE_CONTENT_GATE_CONTRACT_ID=CDOBDWMD7477BX4JRBA6MKQRAVCPPSTMDW7IBFQW4HHPEWTFDP7HDJYZ
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

## Contracts

- `SubscriptionContract`: subscribe, check active status, cancel.
- `ContentGateContract`: asks the subscription contract whether the wallet can view premium content.

## Deployment

The frontend is configured for Vercel in `frontend/vercel.json`.

