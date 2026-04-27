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
        if buy_price <= 0 { return Err(SwapError::InvalidPrice); }
        seller.require_auth();
        
        // 1. Transfer funds to Escrow (this contract)
        let client = token::Client::new(&env, &sell_token);
        client.transfer(&seller, &env.current_contract_address(), &sell_amount);

        // 2. Get unique order ID from instance storage
        let order_id: u64 = env.storage().instance().get(&Symbol::new(&env, "order_id")).unwrap_or(0);
        let next_id = order_id + 1;
        env.storage().instance().set(&Symbol::new(&env, "order_id"), &next_id);

        // 3. Store order
        let order = Order { 
            seller: seller.clone(), 
            sell_token, 
            buy_token, 
            sell_amount, 
            buy_price 
        };
        env.storage().persistent().set(&next_id, &order);
        
        // 4. Emit event
        env.events().publish(
            (Symbol::new(&env, "place_order"),),
            (next_id,),
        );

        Ok(next_id)
    }

    pub fn get_order(env: Env, id: u64) -> Option<Order> {
        env.storage().persistent().get(&id)
    }

    pub fn get_order_count(env: Env) -> u64 {
        env.storage().instance().get(&Symbol::new(&env, "order_id")).unwrap_or(0)
    }

    pub fn fill_order(
        env: Env,
        buyer: Address,
        id: u64,
    ) -> Result<(), SwapError> {
        buyer.require_auth();

        // 1. Get order
        let order: Order = env.storage().persistent().get(&id).ok_or(SwapError::OrderNotFound)?;

        // 2. Transfer buy_token (e.g. XLM) from buyer to seller
        let buy_client = token::Client::new(&env, &order.buy_token);
        buy_client.transfer(&buyer, &order.seller, &order.buy_price);

        // 3. Transfer sell_token (e.g. USDC) from contract to buyer
        let sell_client = token::Client::new(&env, &order.sell_token);
        sell_client.transfer(&env.current_contract_address(), &buyer, &order.sell_amount);

        // 4. Remove order from storage
        env.storage().persistent().remove(&id);

        // 5. Emit event
        env.events().publish(
            (Symbol::new(&env, "fill_order"),),
            (id,),
        );

        Ok(())
    }

    pub fn cancel_order(
        env: Env,
        id: u64,
    ) -> Result<(), SwapError> {
        // 1. Get order
        let order: Order = env.storage().persistent().get(&id).ok_or(SwapError::OrderNotFound)?;
        
        // 2. Ensure only seller can cancel
        order.seller.require_auth();

        // 3. Refund sell_token from contract to seller
        let sell_client = token::Client::new(&env, &order.sell_token);
        sell_client.transfer(&env.current_contract_address(), &order.seller, &order.sell_amount);

        // 4. Remove order from storage
        env.storage().persistent().remove(&id);

        // 5. Emit event
        env.events().publish(
            (Symbol::new(&env, "cancel_order"),),
            (id,),
        );

        Ok(())
    }
}

mod test;
