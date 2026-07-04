# Decentralized Subscription & Content Access Pass

> Time-based content access powered by Soroban smart contracts — no platform, no middlemen, no trust required.

## What it does

Creators deploy a subscription contract on Stellar. Fans pay XLM to mint a time-locked access pass. The contract enforces expiry automatically — no renewals, no manual checks. When the pass expires, access is revoked on-chain. Any frontend can gate content by querying the contract.

## Why Stellar

Stellar's sub-cent fees make $1/month subscriptions economically viable. On Ethereum, gas alone kills the model. Soroban's instance storage and TTL (time-to-live) mechanics are a natural fit for expiring access passes.

## Tech stack

- **Soroban** — subscription + content-gate contracts
- **Freighter wallet** — wallet connect / disconnect
- **StellarWalletsKit** — multi-wallet support
- **React + TypeScript** — frontend
- **Stellar Testnet** — deployment target

## Level progression

| Level | Status | What's built |
|-------|--------|-------------|
| L1 | ✅ Done | Wallet connect/disconnect (StellarWalletsKit + Freighter), XLM balance display, XLM send via Horizon, tx hash feedback |
| L2 | ✅ Done | SubscriptionContract deployed (subscribe/is_active/cancel), ContentGateContract deployed (check_access cross-contract), multi-wallet UI, real-time event feed, 3 error types (WalletNotFound/UserRejected/InsufficientBalance) |
| L3 | ✅ Done | Inter-contract communication (ContentGate → SubscriptionContract), mobile-responsive UI, real-time subscriber event feed |

## Contract architecture

```
SubscriptionContract
  ├── subscribe(duration)       → mints access pass, sets expiry timestamp
  ├── is_active(address)        → returns bool, used by content gate
  └── cancel(address)           → creator-callable early revocation

ContentGateContract
  └── check_access(address)     → calls SubscriptionContract.is_active()
```

## Setup

```bash
git clone <repo-url>
cd subscription-access-pass

# Install frontend deps
cd frontend && npm install && cd ..

# Start frontend (contracts already deployed on testnet)
cd frontend && npm run dev
```

## Environment variables

```env
VITE_SUBSCRIPTION_CONTRACT_ID=CD6SWQZYNCJ2GX7LUGFGXEENO7WCQLNHLFUZNBRNC5GWSUL7FRIBAIWE
VITE_CONTENT_GATE_CONTRACT_ID=CDOBDWMD7477BX4JRBA6MKQRAVCPPSTMDW7IBFQW4HHPEWTFDP7HDJYZ
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

## Deployed contracts

| Contract | Address |
|----------|---------|
| SubscriptionContract | `CD6SWQZYNCJ2GX7LUGFGXEENO7WCQLNHLFUZNBRNC5GWSUL7FRIBAIWE` |
| ContentGateContract | `CDOBDWMD7477BX4JRBA6MKQRAVCPPSTMDW7IBFQW4HHPEWTFDP7HDJYZ` |

## Screenshots

<!-- Add: wallet connected, balance shown, active pass UI, expired pass UI -->

## Transaction reference

Contract call tx hash: `[verifiable on Stellar Expert]`
