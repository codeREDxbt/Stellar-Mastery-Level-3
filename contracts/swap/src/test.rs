#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_invalid_price() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SwapContract);
    let client = SwapContractClient::new(&env, &contract_id);

    let seller = Address::generate(&env);
    let sell_token = Address::generate(&env);
    let buy_token = Address::generate(&env);

    let result = client.try_place_order(&seller, &sell_token, &buy_token, &100, &0);
    assert_eq!(result, Err(Ok(SwapError::InvalidPrice)));
}

// More extensive tests require setting up SAC token mock contracts.
// We've demonstrated testing an error case (InvalidPrice).
