# SendBridge Soroban Contract Makefile

NETWORK ?= testnet
SOURCE_ACCOUNT ?= default
CONTRACT_DIR := contracts/contract
# Note: The crate name in Cargo.toml is currently "hello-world", 
# which outputs hello_world.wasm
CRATE_NAME := hello_world
WASM_PATH := target/wasm32-unknown-unknown/release/$(CRATE_NAME).wasm
OPT_WASM_PATH := target/wasm32-unknown-unknown/release/$(CRATE_NAME).optimized.wasm

.PHONY: all build optimize test deploy bindings clean

all: build optimize

test:
	cargo test

build:
	cargo build --target wasm32-unknown-unknown --release

optimize: build
	stellar contract optimize --wasm $(WASM_PATH)

deploy: optimize
	@echo "Deploying contract to $(NETWORK)..."
	stellar contract deploy \
		--wasm $(OPT_WASM_PATH) \
		--source $(SOURCE_ACCOUNT) \
		--network $(NETWORK)

bindings:
	@echo "Generating TypeScript bindings..."
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID is required."; \
		echo "Usage: make bindings CONTRACT_ID=<deployed-contract-id>"; \
		exit 1; \
	fi
	stellar contract bindings typescript \
		--network $(NETWORK) \
		--contract-id $(CONTRACT_ID) \
		--output-dir ../client/src/lib/stellar/bindings \
		--overwrite

clean:
	cargo clean
