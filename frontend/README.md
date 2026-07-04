# Frontend

This folder contains the React app for the Stellar subscription experience.

## What the UI does

- Connects a Freighter wallet.
- Reads XLM balance from Stellar.
- Checks whether the subscription pass is active.
- Verifies premium access through the content gate contract.
- Lets the user mint a time-locked access pass by signing one transaction.
- Shows a premium content section that unlocks only when access is valid.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

## Notes

- The frontend is configured for Stellar testnet.
- Freighter is required for wallet connection and transaction signing.
- Vercel deployment settings live in `vercel.json`.

