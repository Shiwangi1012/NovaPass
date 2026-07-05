#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SubscriptionContract);
    let client = SubscriptionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_init_twice() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SubscriptionContract);
    let client = SubscriptionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);
    client.init(&admin); // Should panic
}

#[test]
fn test_subscribe() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SubscriptionContract);
    let client = SubscriptionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.init(&admin);

    let subscriber = Address::generate(&env);
    let duration_days = 30;
<<<<<<< HEAD
    
    assert!(!client.is_active(&subscriber));    
    
    client.subscribe(&subscriber, &duration_days);

    assert!(client.is_active(&subscriber));
    
=======

    assert_eq!(client.is_active(&subscriber), false);

    client.subscribe(&subscriber, &duration_days);

    assert_eq!(client.is_active(&subscriber), true);
>>>>>>> adcde06 (Format rust code)
}
