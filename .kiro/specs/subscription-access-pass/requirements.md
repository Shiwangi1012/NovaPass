# Requirements Document

## Introduction

This feature implements a Decentralized Subscription & Content Access Pass on the Stellar network using Soroban smart contracts. Creators deploy a subscription contract; users pay XLM to mint a time-locked access pass. The contract enforces expiry automatically via Soroban's TTL mechanics — no manual renewal, no trusted intermediary. A separate ContentGateContract queries the SubscriptionContract to enforce content access. The frontend is built in React + TypeScript, integrates Freighter wallet via StellarWalletsKit, and operates exclusively on Stellar Testnet.

---

## Glossary

- **SubscriptionContract**: Soroban smart contract that manages subscriptions — minting, expiry, and cancellation.
- **ContentGateContract**: Soroban smart contract that checks content access by calling `SubscriptionContract.is_active()`.
- **AccessPass**: A time-locked record stored in the SubscriptionContract that grants a subscriber access until a specific ledger timestamp.
- **Subscriber**: A Stellar account that has called `subscribe()` with a valid XLM payment.
- **Creator**: The account that deployed the SubscriptionContract and can call `cancel()`.
- **StellarWalletsKit**: A multi-wallet adapter library that abstracts Freighter and other Stellar wallets.
- **Freighter**: A browser extension wallet for Stellar accounts.
- **Duration**: The subscription length in seconds (a positive integer).
- **Expiry**: The ledger close time (Unix timestamp) after which an AccessPass is no longer valid.
- **TxHash**: The transaction hash returned by the Stellar network after a submitted transaction.
- **Testnet**: The Stellar test network used for all deployments and transactions in this project.

---

## Requirements

### Requirement 1: Wallet Connection and Disconnection

**User Story:** As a user, I want to connect and disconnect my Stellar wallet, so that I can interact with subscription contracts using my on-chain identity.

#### Acceptance Criteria

1. WHEN a user clicks the connect button, THE StellarWalletsKit SHALL open a wallet selection modal listing all supported wallets.
2. WHEN a user selects Freighter from the wallet modal, THE StellarWalletsKit SHALL request connection permission from the Freighter extension.
3. WHEN Freighter grants connection permission, THE StellarWalletsKit SHALL return the connected public key to the frontend.
4. WHEN the wallet is connected, THE Frontend SHALL display the truncated public key and a disconnect button.
5. WHEN a user clicks disconnect, THE StellarWalletsKit SHALL clear the active wallet session and THE Frontend SHALL revert to the disconnected state.
6. IF the Freighter extension is not installed, THEN THE Frontend SHALL display an error message directing the user to install Freighter.
7. IF the user rejects the connection request in Freighter, THEN THE Frontend SHALL display an error message stating the connection was rejected.

---

### Requirement 2: XLM Balance Display

**User Story:** As a user, I want to see my XLM balance after connecting my wallet, so that I know whether I have sufficient funds before subscribing.

#### Acceptance Criteria

1. WHEN the wallet is connected, THE Frontend SHALL query the Stellar Horizon API for the connected account's XLM balance.
2. WHEN the balance is retrieved, THE Frontend SHALL display the XLM balance with 2 decimal places of precision.
3. WHEN the connected account has no XLM balance or does not exist on Testnet, THE Frontend SHALL display a balance of 0.00 XLM.
4. IF the Horizon API request fails, THEN THE Frontend SHALL display an error message and retain the last known balance or show 0.00 XLM.

---

### Requirement 3: Subscribe — Mint an Access Pass

**User Story:** As a subscriber, I want to pay XLM and receive a time-locked access pass, so that I can access gated content for a defined period.

#### Acceptance Criteria

1. WHEN a user submits a subscription request with a valid duration, THE Frontend SHALL build a Soroban transaction invoking `SubscriptionContract.subscribe(duration)`.
2. WHEN the transaction is built, THE StellarWalletsKit SHALL prompt the connected wallet to sign the transaction.
3. WHEN the signed transaction is submitted to Testnet, THE SubscriptionContract SHALL record an AccessPass for the subscriber's address with an expiry equal to the current ledger time plus the requested duration.
4. WHEN the transaction succeeds, THE Frontend SHALL display the transaction hash (TxHash) and a success message.
5. IF the user rejects the signing request, THEN THE Frontend SHALL display an error message stating the transaction was rejected.
6. IF the subscriber's account has insufficient XLM to cover the subscription fee and transaction fees, THEN THE Frontend SHALL display an error message stating insufficient balance.
7. WHEN a subscriber calls `subscribe()` while an existing AccessPass is still active, THE SubscriptionContract SHALL extend the expiry by the requested duration rather than overwriting it.

---

### Requirement 4: Check Access Pass Status

**User Story:** As a user, I want to know whether my subscription is currently active, so that I can verify my access before attempting to consume gated content.

#### Acceptance Criteria

1. WHEN a user requests their subscription status, THE Frontend SHALL invoke `SubscriptionContract.is_active(address)` with the connected wallet's public key.
2. WHEN `is_active` returns `true`, THE Frontend SHALL display that the AccessPass is active and show the expiry timestamp in a human-readable format.
3. WHEN `is_active` returns `false`, THE Frontend SHALL display that the AccessPass has expired or does not exist.
4. THE SubscriptionContract SHALL return `false` for `is_active(address)` when no AccessPass has been created for that address.
5. THE SubscriptionContract SHALL return `false` for `is_active(address)` when the current ledger time is greater than or equal to the stored expiry timestamp.

---

### Requirement 5: Cancel a Subscription

**User Story:** As a creator, I want to revoke a subscriber's access pass early, so that I can enforce terms of service violations or process refunds manually.

#### Acceptance Criteria

1. WHEN the creator calls `cancel(address)`, THE SubscriptionContract SHALL remove the AccessPass for the specified subscriber address.
2. WHEN the AccessPass is removed, THE SubscriptionContract.is_active(address) SHALL return `false` for that address immediately.
3. IF `cancel(address)` is called by an account that is not the creator, THEN THE SubscriptionContract SHALL return an authorization error and SHALL NOT modify any AccessPass.
4. IF `cancel(address)` is called for an address with no active AccessPass, THEN THE SubscriptionContract SHALL return a not-found error.

---

### Requirement 6: Content Gate Access Check (Inter-Contract)

**User Story:** As a content platform, I want to verify a user's subscription status through the ContentGateContract, so that I can enforce access control without duplicating subscription logic.

#### Acceptance Criteria

1. WHEN `ContentGateContract.check_access(address)` is called, THE ContentGateContract SHALL invoke `SubscriptionContract.is_active(address)` on the deployed SubscriptionContract.
2. WHEN `SubscriptionContract.is_active(address)` returns `true`, THE ContentGateContract SHALL return `true` to the caller.
3. WHEN `SubscriptionContract.is_active(address)` returns `false`, THE ContentGateContract SHALL return `false` to the caller.
4. THE ContentGateContract SHALL read the SubscriptionContract address from its own initialized storage rather than accepting it as a call-time parameter.
5. IF the SubscriptionContract call fails (e.g., contract not found or invocation error), THEN THE ContentGateContract SHALL return an error indicating the access check could not be completed.

---

### Requirement 7: Multi-Wallet Support

**User Story:** As a user, I want to connect with wallets other than Freighter, so that I am not locked into a single wallet provider.

#### Acceptance Criteria

1. THE StellarWalletsKit SHALL be initialized with at least Freighter as a supported wallet module.
2. WHEN additional wallet modules are configured, THE StellarWalletsKit SHALL present them alongside Freighter in the wallet selection modal.
3. WHEN any supported wallet is connected, THE Frontend SHALL use the same wallet interaction flow as defined for Freighter in Requirements 1–5.
4. WHEN a connected wallet is not found or not installed, THE Frontend SHALL display a wallet-specific error message identifying which wallet is missing.

---

### Requirement 8: Transaction Status Tracking

**User Story:** As a user, I want to see the real-time status of my submitted transactions, so that I know whether my subscription action succeeded or is still processing.

#### Acceptance Criteria

1. WHEN a transaction is submitted, THE Frontend SHALL display a pending status indicator immediately.
2. WHEN the Stellar network confirms the transaction, THE Frontend SHALL display a success status and the TxHash as a link to Stellar Expert (Testnet).
3. IF the transaction fails on-chain, THEN THE Frontend SHALL display a failure status and the reason returned by the Soroban RPC.
4. WHEN a TxHash is displayed, THE Frontend SHALL format it as a clickable link pointing to `https://stellar.expert/explorer/testnet/tx/{TxHash}`.

---

### Requirement 9: Event Feed for New Subscribers

**User Story:** As a creator, I want to see a real-time feed of new subscribers, so that I can monitor subscription activity without querying the contract manually.

#### Acceptance Criteria

1. THE Frontend SHALL subscribe to Soroban contract events emitted by the SubscriptionContract.
2. WHEN a `subscribe` event is emitted by the SubscriptionContract, THE Frontend SHALL append a new entry to the subscriber event feed displaying the subscriber address and the subscription timestamp.
3. WHEN no subscription events have occurred, THE Frontend SHALL display an empty state message in the event feed.
4. THE SubscriptionContract SHALL emit a contract event upon each successful `subscribe()` call containing the subscriber address and expiry timestamp.

---

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want contract addresses and network settings stored in environment variables, so that the frontend can be reconfigured for different deployments without code changes.

#### Acceptance Criteria

1. THE Frontend SHALL read the SubscriptionContract address from the `VITE_SUBSCRIPTION_CONTRACT_ID` environment variable.
2. THE Frontend SHALL read the ContentGateContract address from the `VITE_CONTENT_GATE_CONTRACT_ID` environment variable.
3. THE Frontend SHALL read the target Stellar network from the `VITE_STELLAR_NETWORK` environment variable.
4. IF any required environment variable is missing or empty at startup, THEN THE Frontend SHALL display a configuration error message and SHALL NOT attempt any contract interactions.
5. THE Frontend SHALL NOT contain hardcoded contract addresses or network identifiers.

---

### Requirement 11: Mobile-Responsive UI

**User Story:** As a mobile user, I want the subscription interface to be usable on small screens, so that I can manage my access pass from any device.

#### Acceptance Criteria

1. THE Frontend SHALL render all wallet connect, balance, subscribe, and status views correctly at viewport widths from 320px to 1920px.
2. WHEN the viewport width is below 768px, THE Frontend SHALL stack layout elements vertically and adjust font sizes to remain legible.
3. THE Frontend SHALL NOT require horizontal scrolling at any supported viewport width.

---

### Requirement 12: Contract Test Coverage (Level 3)

**User Story:** As a developer, I want automated contract tests, so that I can verify the SubscriptionContract and ContentGateContract behave correctly before deployment.

#### Acceptance Criteria

1. THE Test_Suite SHALL include at least 3 passing tests covering `subscribe`, `is_active`, and `cancel` on the SubscriptionContract.
2. WHEN `subscribe(duration)` is called with a valid duration, THE Test_Suite SHALL verify the AccessPass expiry equals the ledger timestamp at call time plus the duration.
3. WHEN `is_active(address)` is called after expiry, THE Test_Suite SHALL verify the return value is `false`.
4. WHEN `cancel(address)` is called by an unauthorized account, THE Test_Suite SHALL verify an authorization error is returned.
5. THE Test_Suite SHALL run via `cargo test` without requiring external network access (using Soroban's test environment).

---

### Requirement 13: CI/CD Pipeline (Level 3)

**User Story:** As a developer, I want a CI/CD pipeline, so that contract builds and tests are verified automatically on every code push.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL build the Soroban contracts using `cargo build --target wasm32-unknown-unknown --release` on every push to the main branch.
2. THE CI_Pipeline SHALL run contract tests using `cargo test` on every push to the main branch.
3. IF any contract build or test step fails, THEN THE CI_Pipeline SHALL mark the pipeline run as failed and SHALL NOT proceed to deployment steps.
4. THE CI_Pipeline SHALL build the React frontend using `npm run build` on every push to the main branch.
