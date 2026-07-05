#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol,
};

// Storage key types
#[contracttype]
pub enum DataKey {
    Admin,
    Subscriber(Address),
}

// 17280 ledgers per day at ~5s/ledger
const LEDGERS_PER_DAY: u64 = 17280;

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    /// Set the contract admin (called once after deployment).
    pub fn init(env: Env, admin: Address) {
        // Prevent re-initialization
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        // Keep instance storage alive for a long time (1 year ≈ 6_307_200 ledgers)
        env.storage().instance().extend_ttl(6_307_200, 6_307_200);
    }

    /// Mint a time-locked access pass for `subscriber` lasting `duration_days` days.
    /// The subscriber must authorize this call (they are paying).
    pub fn subscribe(env: Env, subscriber: Address, duration_days: u64) {
        subscriber.require_auth();

        let expiry_ledger = env.ledger().sequence() + (duration_days * LEDGERS_PER_DAY) as u32;

        env.storage()
            .persistent()
            .set(&DataKey::Subscriber(subscriber.clone()), &expiry_ledger);

        // Extend the persistent entry TTL to at least cover the subscription + buffer
        let ttl = expiry_ledger - env.ledger().sequence() + 17280; // +1 day buffer
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Subscriber(subscriber.clone()), ttl, ttl);

        // Emit subscribe event: topic = "subscribe", data = (subscriber, expiry_ledger)
        env.events().publish(
            (Symbol::new(&env, "subscribe"), subscriber.clone()),
            expiry_ledger,
        );
    }

    /// Returns true if `subscriber` has a currently active (non-expired) pass.
    pub fn is_active(env: Env, subscriber: Address) -> bool {
        let key = DataKey::Subscriber(subscriber);
        if let Some(expiry_ledger) = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&key)
        {
            env.ledger().sequence() < expiry_ledger
        } else {
            false
        }
    }

    /// Admin-only: immediately revoke a subscriber's access pass.
    pub fn cancel(env: Env, subscriber: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        env.storage()
            .persistent()
            .remove(&DataKey::Subscriber(subscriber));
    }
}

#[cfg(test)]
mod test;
