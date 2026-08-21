#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, Address, BytesN, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    KycRequired = 4,
    InvalidAmount = 5,
    TransferNotFound = 6,
    InvalidStatusTransition = 7,
    CannotCancel = 8,
}

#[contracttype]
#[derive(Clone, Eq, PartialEq, Debug)]
pub enum TransferStatus {
    Pending,
    Processing,
    Completed,
    Cancelled,
    Failed,
}

#[contracttype]
#[derive(Clone)]
pub struct Transfer {
    pub id: u32,
    pub sender: Address,
    pub recipient: Address,
    pub source_asset: Symbol,
    pub dest_asset: Symbol,
    pub source_amount: i128,
    pub dest_amount: i128,
    pub exchange_rate: u64,
    pub fee_bps: u32,
    pub status: TransferStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct KycInfo {
    pub verified: bool,
    pub attestation_hash: BytesN<32>,
    pub verified_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Operator,
    FeeBps,
    TransferCount,
    Transfer(u32),
    Kyc(Address),
    Rate(Symbol, Symbol),
}

#[contract]
pub struct SendBridge;

#[contractimpl]
impl SendBridge {
    // ── Lifecycle ──────────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeeBps, &50u32);
        env.storage().instance().set(&DataKey::TransferCount, &0u32);
    }

    // ── Operator ───────────────────────────────────────────────

    pub fn set_operator(env: Env, caller: Address, operator: Address) {
        Self::require_admin(&env, &caller);
        env.storage().instance().set(&DataKey::Operator, &operator);
        env.events().publish(
            (symbol_short!("OPER_UPD"),),
            (caller, operator),
        );
    }

    pub fn get_operator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Operator).unwrap()
    }

    // ── KYC ───────────────────────────────────────────────────

    pub fn set_kyc_attestation(
        env: Env,
        caller: Address,
        wallet: Address,
        attestation_hash: BytesN<32>,
    ) {
        Self::require_operator(&env, &caller);
        let info = KycInfo {
            verified: true,
            attestation_hash: attestation_hash.clone(),
            verified_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Kyc(wallet.clone()), &info);
        env.events().publish(
            (symbol_short!("KYC_VER"),),
            (wallet, attestation_hash),
        );
    }

    pub fn is_kyc_verified(env: Env, wallet: Address) -> bool {
        env.storage()
            .persistent()
            .get::<_, KycInfo>(&DataKey::Kyc(wallet))
            .map(|k| k.verified)
            .unwrap_or(false)
    }

    pub fn get_kyc(env: Env, wallet: Address) -> Option<KycInfo> {
        env.storage().persistent().get(&DataKey::Kyc(wallet))
    }

    // ── Exchange Rate ──────────────────────────────────────────

    pub fn set_exchange_rate(
        env: Env,
        caller: Address,
        source_asset: Symbol,
        dest_asset: Symbol,
        rate: u64,
    ) {
        Self::require_operator(&env, &caller);
        assert!(rate > 0, "rate must be positive");
        env.storage()
            .instance()
            .set(&DataKey::Rate(source_asset.clone(), dest_asset.clone()), &rate);
        env.events().publish(
            (symbol_short!("RATE_UPD"),),
            (source_asset, dest_asset, rate),
        );
    }

    pub fn get_exchange_rate(env: Env, source_asset: Symbol, dest_asset: Symbol) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::Rate(source_asset, dest_asset))
            .unwrap_or(0)
    }

    // ── Fee ────────────────────────────────────────────────────

    pub fn set_fee_bps(env: Env, caller: Address, fee_bps: u32) {
        Self::require_admin(&env, &caller);
        assert!(fee_bps <= 1000, "fee too high");
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.events().publish((symbol_short!("FEE_UPD"),), fee_bps);
    }

    pub fn get_fee_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeeBps).unwrap_or(50)
    }

    // ── Transfer ───────────────────────────────────────────────

    pub fn create_transfer(
        env: Env,
        sender: Address,
        recipient: Address,
        source_asset: Symbol,
        dest_asset: Symbol,
        source_amount: i128,
        dest_amount: i128,
        exchange_rate: u64,
        fee_bps: u32,
    ) -> u32 {
        sender.require_auth();
        assert!(source_amount > 0, "source amount must be positive");
        assert!(dest_amount > 0, "dest amount must be positive");

        let kyc = env
            .storage()
            .persistent()
            .get::<_, KycInfo>(&DataKey::Kyc(sender.clone()));
        match kyc {
            Some(k) if k.verified => {}
            _ => panic_with_error!(&env, Error::KycRequired),
        }

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TransferCount)
            .unwrap_or(0);
        let now = env.ledger().timestamp();

        let transfer = Transfer {
            id,
            sender: sender.clone(),
            recipient: recipient.clone(),
            source_asset: source_asset.clone(),
            dest_asset: dest_asset.clone(),
            source_amount,
            dest_amount,
            exchange_rate,
            fee_bps,
            status: TransferStatus::Pending,
            created_at: now,
            updated_at: now,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Transfer(id), &transfer);
        env.storage()
            .instance()
            .set(&DataKey::TransferCount, &(id + 1));

        env.events().publish(
            (symbol_short!("TX_CR"),),
            (id, sender, recipient, source_amount, dest_amount),
        );

        id
    }

    pub fn get_transfer(env: Env, id: u32) -> Transfer {
        env.storage()
            .persistent()
            .get::<_, Transfer>(&DataKey::Transfer(id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::TransferNotFound))
    }

    pub fn get_transfer_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TransferCount).unwrap_or(0)
    }

    pub fn get_transfer_status(env: Env, id: u32) -> TransferStatus {
        Self::get_transfer(env, id).status
    }

    pub fn update_transfer_status(
        env: Env,
        caller: Address,
        id: u32,
        new_status: TransferStatus,
    ) {
        Self::require_operator(&env, &caller);

        let mut transfer: Transfer = env
            .storage()
            .persistent()
            .get(&DataKey::Transfer(id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::TransferNotFound));

        assert!(
            Self::is_valid_transition(&transfer.status, &new_status),
            "invalid status transition"
        );

        transfer.status = new_status.clone();
        transfer.updated_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Transfer(id), &transfer);

        let event_name = match &new_status {
            TransferStatus::Processing => symbol_short!("TX_PR"),
            TransferStatus::Completed => symbol_short!("TX_CO"),
            TransferStatus::Failed => symbol_short!("TX_FL"),
            _ => symbol_short!("TX_UPD"),
        };
        env.events().publish((event_name,), (id, new_status));
    }

    pub fn cancel_transfer(env: Env, sender: Address, id: u32) {
        sender.require_auth();

        let mut transfer: Transfer = env
            .storage()
            .persistent()
            .get(&DataKey::Transfer(id))
            .unwrap_or_else(|| panic_with_error!(&env, Error::TransferNotFound));

        assert!(transfer.sender == sender, "not your transfer");
        assert!(
            transfer.status == TransferStatus::Pending,
            "can only cancel pending transfers"
        );

        transfer.status = TransferStatus::Cancelled;
        transfer.updated_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Transfer(id), &transfer);

        env.events()
            .publish((symbol_short!("TX_CA"),), (id, sender));
    }

    pub fn get_recent_transfers(env: Env, count: u32) -> Vec<Transfer> {
        let total: u32 = env.storage().instance().get(&DataKey::TransferCount).unwrap_or(0);
        let mut result = Vec::new(&env);
        if total == 0 {
            return result;
        }
        let start = if count >= total { 0 } else { total - count };
        let mut i = start;
        while i < total {
            if let Some(t) = env.storage().persistent().get::<_, Transfer>(&DataKey::Transfer(i)) {
                result.push_back(t);
            }
            i += 1;
        }
        result
    }

    // ── Internal helpers ───────────────────────────────────────

    fn require_admin(env: &Env, caller: &Address) {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(*caller == admin, "not admin");
    }

    fn require_operator(env: &Env, caller: &Address) {
        caller.require_auth();
        let operator: Address = env.storage().instance().get(&DataKey::Operator).unwrap();
        assert!(*caller == operator, "not operator");
    }

    fn is_valid_transition(from: &TransferStatus, to: &TransferStatus) -> bool {
        matches!(
            (from, to),
            (TransferStatus::Pending, TransferStatus::Processing)
                | (TransferStatus::Pending, TransferStatus::Cancelled)
                | (TransferStatus::Processing, TransferStatus::Completed)
                | (TransferStatus::Processing, TransferStatus::Failed)
        )
    }
}

mod test;
