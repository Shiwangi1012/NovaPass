#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ContentGateContract);
    let client = ContentGateContractClient::new(&env, &contract_id);

    let sub_contract = Address::generate(&env);
    client.init(&sub_contract);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_init_twice() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ContentGateContract);
    let client = ContentGateContractClient::new(&env, &contract_id);

    let sub_contract = Address::generate(&env);
    client.init(&sub_contract);
    client.init(&sub_contract);
}
