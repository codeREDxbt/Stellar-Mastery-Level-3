#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, token, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AmmError {
    InsufficientReserves = 1,
    InvalidAmount        = 2,
    Unauthorized         = 3,
}

#[contract]
pub struct AmmContract;

#[contractimpl]
impl AmmContract {
    /// Initialize the pool or add more liquidity.
    /// In this simplified version, we'll use a direct deposit model.
    pub fn deposit(
        env: Env,
        provider: Address,
        token_a: Address,
        token_b: Address,
        amount_a: i128,
        amount_b: i128,
    ) -> Result<(), AmmError> {
        provider.require_auth();
        if amount_a <= 0 || amount_b <= 0 { return Err(AmmError::InvalidAmount); }

        let client_a = token::Client::new(&env, &token_a);
        let client_b = token::Client::new(&env, &token_b);

        // Transfer funds to contract
        client_a.transfer(&provider, &env.current_contract_address(), &amount_a);
        client_b.transfer(&provider, &env.current_contract_address(), &amount_b);

        // Update reserves in instance storage
        let mut res_a: i128 = env.storage().instance().get(&Symbol::new(&env, "res_a")).unwrap_or(0);
        let mut res_b: i128 = env.storage().instance().get(&Symbol::new(&env, "res_b")).unwrap_or(0);

        res_a += amount_a;
        res_b += amount_b;

        env.storage().instance().set(&Symbol::new(&env, "res_a"), &res_a);
        env.storage().instance().set(&Symbol::new(&env, "res_b"), &res_b);
        
        // Permanent record of tokens in the pool
        env.storage().instance().set(&Symbol::new(&env, "token_a"), &token_a);
        env.storage().instance().set(&Symbol::new(&env, "token_b"), &token_b);

        env.events().publish((Symbol::new(&env, "deposit"),), (amount_a, amount_b));
        Ok(())
    }

    /// Instant Swap: Trade Token A for Token B or vice-versa.
    /// Logic: (x + dx) * (y - dy) = x * y
    pub fn swap(
        env: Env,
        buyer: Address,
        token_in: Address,
        amount_in: i128,
    ) -> Result<i128, AmmError> {
        buyer.require_auth();
        if amount_in <= 0 { return Err(AmmError::InvalidAmount); }

        let token_a: Address = env.storage().instance().get(&Symbol::new(&env, "token_a")).unwrap();
        let token_b: Address = env.storage().instance().get(&Symbol::new(&env, "token_b")).unwrap();
        let mut res_a: i128 = env.storage().instance().get(&Symbol::new(&env, "res_a")).unwrap_or(0);
        let mut res_b: i128 = env.storage().instance().get(&Symbol::new(&env, "res_b")).unwrap_or(0);

        if res_a == 0 || res_b == 0 { return Err(AmmError::InsufficientReserves); }

        let (amount_out, is_a_to_b) = if token_in == token_a {
            // dy = (y * dx) / (x + dx)
            let out = (res_b * amount_in) / (res_a + amount_in);
            (out, true)
        } else if token_in == token_b {
            let out = (res_a * amount_in) / (res_b + amount_in);
            (out, false)
        } else {
            return Err(AmmError::InvalidAmount);
        };

        if amount_out <= 0 { return Err(AmmError::InsufficientReserves); }

        // Execute transfers
        let client_in = token::Client::new(&env, &token_in);
        let token_out = if is_a_to_b { token_b } else { token_a };
        let client_out = token::Client::new(&env, &token_out);

        client_in.transfer(&buyer, &env.current_contract_address(), &amount_in);
        client_out.transfer(&env.current_contract_address(), &buyer, &amount_out);

        // Update reserves
        if is_a_to_b {
            res_a += amount_in;
            res_b -= amount_out;
        } else {
            res_b += amount_in;
            res_a -= amount_out;
        }

        env.storage().instance().set(&Symbol::new(&env, "res_a"), &res_a);
        env.storage().instance().set(&Symbol::new(&env, "res_b"), &res_b);

        env.events().publish((Symbol::new(&env, "swap"),), (amount_in, amount_out));
        Ok(amount_out)
    }

    /// Withdraw liquidity from the pool.
    pub fn withdraw(
        env: Env,
        provider: Address,
        amount_a: i128,
        amount_b: i128,
    ) -> Result<(), AmmError> {
        provider.require_auth();
        
        let token_a: Address = env.storage().instance().get(&Symbol::new(&env, "token_a")).unwrap();
        let token_b: Address = env.storage().instance().get(&Symbol::new(&env, "token_b")).unwrap();
        let mut res_a: i128 = env.storage().instance().get(&Symbol::new(&env, "res_a")).unwrap_or(0);
        let mut res_b: i128 = env.storage().instance().get(&Symbol::new(&env, "res_b")).unwrap_or(0);

        if amount_a > res_a || amount_b > res_b { return Err(AmmError::InsufficientReserves); }

        let client_a = token::Client::new(&env, &token_a);
        let client_b = token::Client::new(&env, &token_b);

        client_a.transfer(&env.current_contract_address(), &provider, &amount_a);
        client_b.transfer(&env.current_contract_address(), &provider, &amount_b);

        res_a -= amount_a;
        res_b -= amount_b;

        env.storage().instance().set(&Symbol::new(&env, "res_a"), &res_a);
        env.storage().instance().set(&Symbol::new(&env, "res_b"), &res_b);

        env.events().publish((Symbol::new(&env, "withdraw"),), (amount_a, amount_b));
        Ok(())
    }

    pub fn get_reserves(env: Env) -> (i128, i128) {
        let res_a: i128 = env.storage().instance().get(&Symbol::new(&env, "res_a")).unwrap_or(0);
        let res_b: i128 = env.storage().instance().get(&Symbol::new(&env, "res_b")).unwrap_or(0);
        (res_a, res_b)
    }
}
