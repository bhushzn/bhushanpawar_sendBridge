# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:

```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started.
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.

## Deployment & Development

A `Makefile` has been included in this directory to automate the build, optimization, and deployment of the Soroban contract.

### Prerequisites
Make sure you have the [stellar-cli](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) installed.

### Commands

**Build & Optimize:**
```bash
make build
make optimize
```

**Deploy to Testnet:**
```bash
make deploy
```
*Note: This defaults to `--network testnet` and `--source default`. You can override these with `make deploy NETWORK=futurenet SOURCE_ACCOUNT=alice`.*

### Updating TypeScript Bindings

When you modify the smart contract (e.g. adding a new method to `SendBridge`), you need to regenerate the TypeScript bindings for the frontend.

1. Deploy the new contract using `make deploy`.
2. Copy the resulting `Contract ID`.
3. Generate the bindings:
   ```bash
   make bindings CONTRACT_ID=C...
   ```
4. This will output updated TypeScript packages into `../client/src/lib/stellar/bindings`. Update your frontend imports to use the newly generated methods.
