#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype,
    token, Address, Env, Symbol, log,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SwapError {
    InsufficientBalance = 1,
    InvalidPrice        = 2,
    OrderNotFound       = 3,
}

#[contracttype]
pub struct Order {
    pub seller:      Address,
    pub sell_token:  Address,
    pub buy_token:   Address,
    pub sell_amount: i128,
    pub buy_price:   i128,
}

#[contract]
pub struct SwapContract;

#[contractimpl]
impl SwapContract {
    pub fn place_order(
        env: Env,
        seller: Address,
        sell_token: Address,
        buy_token: Address,
        sell_amount: i128,
        buy_price: i128,
    ) -> Result<u64, SwapError> {
        seller.require_auth();
        if buy_price <= 0 { return Err(SwapError::InvalidPrice); }
        
        let client = token::Client::new(&env, &sell_token);
        let balance = client.balance(&seller);
        if balance < sell_amount { return Err(SwapError::InsufficientBalance); }

        let order_id = env.ledger().sequence() as u64;
        let order = Order { seller: seller.clone(), sell_token, buy_token, sell_amount, buy_price };
        env.storage().persistent().set(&order_id, &order);
        env.events().publish(
            (Symbol::new(&env, "place_order"),),
            (order_id,),
        );
        Ok(order_id)
    }

    pub fn fill_order(env: Env, order_id: u64, buyer: Address) -> Result<(), SwapError> {
        buyer.require_auth();
        let order: Order = env.storage().persistent()
            .get(&order_id)
            .ok_or(SwapError::OrderNotFound)?;

        let sell_client = token::Client::new(&env, &order.sell_token);
        let buy_client  = token::Client::new(&env, &order.buy_token);

        // Atomic transfer: buyer -> seller (buy token), seller -> buyer (sell token)
        // Note: Both parties must have authorized these transfers via Soroban auth
        buy_client.transfer(&buyer, &order.seller, &order.buy_price);
        sell_client.transfer(&order.seller, &buyer, &order.sell_amount);

        env.storage().persistent().remove(&order_id);
        env.events().publish(
            (Symbol::new(&env, "fill_order"),),
            (order_id,),
        );
        Ok(())
    }

    pub fn cancel_order(env: Env, order_id: u64, caller: Address) -> Result<(), SwapError> {
        caller.require_auth();
        let order: Order = env.storage().persistent()
            .get(&order_id)
            .ok_or(SwapError::OrderNotFound)?;
            
        // In a real contract, ensure caller is the seller
        if order.seller != caller {
            return Err(SwapError::OrderNotFound); // Simplification for Level 2
        }
            
        env.storage().persistent().remove(&order_id);
        Ok(())
    }
}

mod test;
