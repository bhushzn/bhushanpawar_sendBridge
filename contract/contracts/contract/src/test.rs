#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

/// Returns (env, admin, operator, contract_id) — create client per-test.
fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let contract_id = env.register(SendBridge, ());
    let client = SendBridgeClient::new(&env, &contract_id);
    client.initialize(&admin);
    client.set_operator(&admin, &operator);
    (env, admin, operator, contract_id)
}

fn client<'a>(env: &'a Env, contract_id: &Address) -> SendBridgeClient<'a> {
    SendBridgeClient::new(env, contract_id)
}

fn dummy_hash(e: &Env) -> BytesN<32> {
    BytesN::from_array(e, &[0xAB; 32])
}

// ── Initialization ─────────────────────────────────────────

#[test]
fn test_initialize() {
    let (env, _admin, operator, cid) = setup();
    let c = client(&env, &cid);
    assert_eq!(c.get_operator(), operator);
    assert_eq!(c.get_fee_bps(), 50);
}

#[test]
#[should_panic(expected = "#2")]
fn test_initialize_cannot_double_init() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(SendBridge, ());
    let c = SendBridgeClient::new(&env, &contract_id);
    c.initialize(&admin);
    c.initialize(&admin); // should panic
}

// ── Operator ───────────────────────────────────────────────

#[test]
fn test_set_operator() {
    let (env, admin, _op, cid) = setup();
    let new_op = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_operator(&admin, &new_op);
    assert_eq!(c.get_operator(), new_op);
}

#[test]
#[should_panic(expected = "not admin")]
fn test_set_operator_unauthorized() {
    let (env, _admin, _op, cid) = setup();
    let nobody = Address::generate(&env);
    let new_op = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_operator(&nobody, &new_op);
}

// ── KYC ────────────────────────────────────────────────────

#[test]
fn test_set_kyc_verified() {
    let (env, _admin, operator, cid) = setup();
    let wallet = Address::generate(&env);
    let h = dummy_hash(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &wallet, &h);
    assert!(c.is_kyc_verified(&wallet));
}

#[test]
fn test_kyc_not_verified_by_default() {
    let (env, _admin, _op, cid) = setup();
    let wallet = Address::generate(&env);
    let c = client(&env, &cid);
    assert!(!c.is_kyc_verified(&wallet));
}

#[test]
fn test_get_kyc_info() {
    let (env, _admin, operator, cid) = setup();
    let wallet = Address::generate(&env);
    let h = dummy_hash(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &wallet, &h);
    let info = c.get_kyc(&wallet).unwrap();
    assert!(info.verified);
    assert_eq!(info.attestation_hash, h);
}

#[test]
#[should_panic(expected = "not operator")]
fn test_set_kyc_unauthorized() {
    let (env, _admin, _op, cid) = setup();
    let wallet = Address::generate(&env);
    let nobody = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&nobody, &wallet, &dummy_hash(&env));
}

// ── Exchange Rate ──────────────────────────────────────────

#[test]
fn test_set_get_exchange_rate() {
    let (env, _admin, operator, cid) = setup();
    let src = Symbol::new(&env, "SB_INR");
    let dst = Symbol::new(&env, "SB_USD");
    let c = client(&env, &cid);
    c.set_exchange_rate(&operator, &src, &dst, &12000u64);
    assert_eq!(c.get_exchange_rate(&src, &dst), 12000);
}

#[test]
#[should_panic(expected = "rate must be positive")]
fn test_rate_zero_panics() {
    let (env, _admin, operator, cid) = setup();
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");
    let c = client(&env, &cid);
    c.set_exchange_rate(&operator, &src, &dst, &0u64);
}

#[test]
fn test_rate_default_zero() {
    let (env, _admin, _op, cid) = setup();
    let src = Symbol::new(&env, "X");
    let dst = Symbol::new(&env, "Y");
    let c = client(&env, &cid);
    assert_eq!(c.get_exchange_rate(&src, &dst), 0);
}

// ── Fee ────────────────────────────────────────────────────

#[test]
fn test_set_get_fee() {
    let (env, admin, _op, cid) = setup();
    let c = client(&env, &cid);
    c.set_fee_bps(&admin, &100u32);
    assert_eq!(c.get_fee_bps(), 100);
}

#[test]
fn test_default_fee() {
    let (env, _admin, _op, cid) = setup();
    let c = client(&env, &cid);
    assert_eq!(c.get_fee_bps(), 50);
}

#[test]
#[should_panic(expected = "fee too high")]
fn test_fee_too_high() {
    let (env, admin, _op, cid) = setup();
    let c = client(&env, &cid);
    c.set_fee_bps(&admin, &1001u32);
}

#[test]
#[should_panic(expected = "not admin")]
fn test_set_fee_unauthorized() {
    let (env, _admin, _op, cid) = setup();
    let nobody = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_fee_bps(&nobody, &100u32);
}

// ── Transfer Creation ─────────────────────────────────────

#[test]
fn test_create_transfer() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let h = dummy_hash(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &h);

    let src = Symbol::new(&env, "SB_INR");
    let dst = Symbol::new(&env, "SB_USD");
    let id = c.create_transfer(
        &sender, &recipient, &src, &dst,
        &10000i128, &120i128, &12000u64, &50u32,
    );
    assert_eq!(id, 0);
    assert_eq!(c.get_transfer_count(), 1);

    let t = c.get_transfer(&0);
    assert_eq!(t.sender, sender);
    assert_eq!(t.recipient, recipient);
    assert_eq!(t.source_asset, src);
    assert_eq!(t.dest_asset, dst);
    assert_eq!(t.source_amount, 10000);
    assert_eq!(t.dest_amount, 120);
    assert_eq!(t.status, TransferStatus::Pending);
}

#[test]
#[should_panic(expected = "#4")]
fn test_create_transfer_requires_kyc() {
    let (env, _admin, _op, cid) = setup();
    let unverified = Address::generate(&env);
    let recipient = Address::generate(&env);
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");
    let c = client(&env, &cid);
    c.create_transfer(
        &unverified, &recipient, &src, &dst,
        &10000i128, &120i128, &12000u64, &50u32,
    );
}

#[test]
#[should_panic(expected = "source amount must be positive")]
fn test_create_transfer_zero_source_amount() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &dummy_hash(&env));
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");
    c.create_transfer(
        &sender, &recipient, &src, &dst,
        &0i128, &120i128, &12000u64, &50u32,
    );
}

#[test]
#[should_panic(expected = "dest amount must be positive")]
fn test_create_transfer_zero_dest_amount() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &dummy_hash(&env));
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");
    c.create_transfer(
        &sender, &recipient, &src, &dst,
        &10000i128, &0i128, &12000u64, &50u32,
    );
}

#[test]
fn test_transfer_count_increments() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &dummy_hash(&env));
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");

    c.create_transfer(&sender, &recipient, &src, &dst, &100i128, &1i128, &1000000u64, &50u32);
    c.create_transfer(&sender, &recipient, &src, &dst, &200i128, &2i128, &1000000u64, &50u32);
    assert_eq!(c.get_transfer_count(), 2);
    assert_eq!(c.get_transfer(&0).id, 0);
    assert_eq!(c.get_transfer(&1).id, 1);
}

// ── Helper for status tests ───────────────────────────────

fn create_test_transfer(env: &Env, cid: &Address, operator: &Address) -> Address {
    let c = client(env, cid);
    let sender = Address::generate(env);
    let recipient = Address::generate(env);
    c.set_kyc_attestation(operator, &sender, &dummy_hash(env));
    let src = Symbol::new(env, "A");
    let dst = Symbol::new(env, "B");
    c.create_transfer(&sender, &recipient, &src, &dst, &100i128, &1i128, &1000000u64, &50u32);
    sender
}

// ── Status Transitions ────────────────────────────────────

#[test]
fn test_pending_to_processing() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Processing);
    assert_eq!(c.get_transfer_status(&0), TransferStatus::Processing);
}

#[test]
fn test_processing_to_completed() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Processing);
    c.update_transfer_status(&operator, &0, &TransferStatus::Completed);
    assert_eq!(c.get_transfer_status(&0), TransferStatus::Completed);
}

#[test]
fn test_processing_to_failed() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Processing);
    c.update_transfer_status(&operator, &0, &TransferStatus::Failed);
    assert_eq!(c.get_transfer_status(&0), TransferStatus::Failed);
}

#[test]
#[should_panic(expected = "invalid status transition")]
fn test_invalid_pending_to_completed() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Completed);
}

#[test]
#[should_panic(expected = "invalid status transition")]
fn test_cannot_transition_after_completed() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Processing);
    c.update_transfer_status(&operator, &0, &TransferStatus::Completed);
    c.update_transfer_status(&operator, &0, &TransferStatus::Failed);
}

#[test]
#[should_panic(expected = "not operator")]
fn test_update_status_unauthorized() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let nobody = Address::generate(&env);
    let c = client(&env, &cid);
    c.update_transfer_status(&nobody, &0, &TransferStatus::Processing);
}

#[test]
#[should_panic(expected = "#6")]
fn test_update_status_not_found() {
    let (env, _admin, operator, cid) = setup();
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &999, &TransferStatus::Processing);
}

// ── Cancel ─────────────────────────────────────────────────

#[test]
fn test_cancel_pending_transfer() {
    let (env, _admin, operator, cid) = setup();
    let sender = create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.cancel_transfer(&sender, &0);
    assert_eq!(c.get_transfer_status(&0), TransferStatus::Cancelled);
}

#[test]
#[should_panic(expected = "can only cancel pending transfers")]
fn test_cannot_cancel_processing() {
    let (env, _admin, operator, cid) = setup();
    let sender = create_test_transfer(&env, &cid, &operator);
    let c = client(&env, &cid);
    c.update_transfer_status(&operator, &0, &TransferStatus::Processing);
    c.cancel_transfer(&sender, &0);
}

#[test]
#[should_panic(expected = "not your transfer")]
fn test_cannot_cancel_others_transfer() {
    let (env, _admin, operator, cid) = setup();
    create_test_transfer(&env, &cid, &operator);
    let stranger = Address::generate(&env);
    let c = client(&env, &cid);
    c.cancel_transfer(&stranger, &0);
}

// ── Get Recent Transfers ──────────────────────────────────

#[test]
fn test_get_recent_transfers() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &dummy_hash(&env));
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");

    c.create_transfer(&sender, &recipient, &src, &dst, &100i128, &1i128, &1000000u64, &50u32);
    c.create_transfer(&sender, &recipient, &src, &dst, &200i128, &2i128, &1000000u64, &50u32);
    c.create_transfer(&sender, &recipient, &src, &dst, &300i128, &3i128, &1000000u64, &50u32);

    let recent = c.get_recent_transfers(&2);
    assert_eq!(recent.len(), 2);
    assert_eq!(recent.get_unchecked(0).id, 1);
    assert_eq!(recent.get_unchecked(1).id, 2);
}

#[test]
fn test_get_recent_transfers_empty() {
    let (env, _admin, _op, cid) = setup();
    let c = client(&env, &cid);
    let recent = c.get_recent_transfers(&10);
    assert_eq!(recent.len(), 0);
}

#[test]
fn test_get_recent_transfers_more_than_available() {
    let (env, _admin, operator, cid) = setup();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let c = client(&env, &cid);
    c.set_kyc_attestation(&operator, &sender, &dummy_hash(&env));
    let src = Symbol::new(&env, "A");
    let dst = Symbol::new(&env, "B");
    c.create_transfer(&sender, &recipient, &src, &dst, &100i128, &1i128, &1000000u64, &50u32);
    let recent = c.get_recent_transfers(&100);
    assert_eq!(recent.len(), 1);
}

// ── Transfer not found ────────────────────────────────────

#[test]
#[should_panic(expected = "#6")]
fn test_get_transfer_not_found() {
    let (env, _admin, _op, cid) = setup();
    let c = client(&env, &cid);
    c.get_transfer(&999);
}
