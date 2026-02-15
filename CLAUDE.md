# CLAUDE.md

## Project Overview

Brownie-based Ethereum smart contract project implementing a crowdfunding (FundMe) application. Users can fund the contract with ETH (minimum 50 USD equivalent via Chainlink price feeds), and only the contract owner can withdraw collected funds. Uses Chainlink oracles for ETH/USD price conversion.

## Repository Structure

```
brownie_fund_me/
├── contracts/
│   ├── FundMe.sol              # Main crowdfunding contract
│   └── MockV3Aggregator.sol    # Mock Chainlink price feed for local testing
├── scripts/
│   ├── __init__.py
│   ├── deploy.py               # Deployment script (deploy_fund_me)
│   ├── fund_and_withdraw.py    # Interaction script (fund + withdraw)
│   └── helpful_scripts.py      # Shared utilities (get_account, deploy_mocks)
├── tests/
│   └── test_fund_me.py         # Pytest-based contract tests
├── brownie-config.yaml         # Brownie configuration (networks, dependencies, wallets)
├── .env                        # Private key (not tracked in git)
└── .gitignore
```

## Tech Stack

- **Framework**: Brownie (Python-based Ethereum development framework)
- **Language**: Solidity (>=0.6.6 <0.9.0) for contracts, Python for scripts/tests
- **Testing**: pytest (via Brownie's test runner)
- **Dependencies**: `smartcontractkit/chainlink-brownie-contracts@1.1.1`
- **Libraries**: web3.py, SafeMathChainlink

## Key Commands

```bash
# Compile contracts
brownie compile

# Run all tests (on local development network)
brownie test

# Run a specific test
brownie test -k test_can_fund_and_withdraw

# Run tests with verbose output
brownie test -v

# Deploy to local development chain
brownie run scripts/deploy.py

# Deploy to rinkeby testnet
brownie run scripts/deploy.py --network rinkeby

# Fund and withdraw on local chain
brownie run scripts/fund_and_withdraw.py

# Open Brownie console
brownie console
```

## Network Configuration

Defined in `brownie-config.yaml`:

| Network             | Type         | Price Feed                   | Verify |
|----------------------|--------------|------------------------------|--------|
| `development`        | Local ganache| Mock deployed automatically  | No     |
| `Ganache-local`      | Local ganache| Mock deployed automatically  | No     |
| `mainnet-fork-dev`   | Mainnet fork | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | No |
| `rinkeby`            | Testnet      | `0x8A753747A1Fa494EC906cE90E9f37563A8AF630e` | Yes |

- **Local networks** (`development`, `Ganache-local`): Use `accounts[0]` and deploy `MockV3Aggregator`
- **Forked networks** (`mainnet-fork`, `mainnet-fork-dev`): Use `accounts[0]` with real mainnet price feed addresses
- **Testnets/mainnet**: Use private key from `.env` via `config["wallets"]["from_key"]`

## Smart Contract Details

### FundMe.sol
- **Constructor**: Accepts a Chainlink `AggregatorV3Interface` price feed address
- **fund()**: Payable function requiring minimum 50 USD equivalent in ETH
- **withdraw()**: Owner-only, transfers all ETH and resets funder tracking
- **getEntranceFee()**: Calculates minimum ETH needed to meet the 50 USD threshold
- **getPrice()**: Returns current ETH price scaled to 18 decimals
- **getConversionRate()**: Converts ETH amount to USD value
- **onlyOwner modifier**: Restricts function access to deployer

### MockV3Aggregator.sol
- Simulates Chainlink price feed for local/test environments
- Deployed with `DECIMALS=8` and `STARTING_PRICE=200000000000` (2000 USD)

## Code Conventions

- **Account handling**: Always use `get_account()` from `helpful_scripts.py` — it returns the correct account type based on the active network
- **Mock deployment**: `deploy_mocks()` checks if `MockV3Aggregator` is already deployed before creating a new one
- **Transaction confirmations**: Use `tx.wait(1)` after state-changing transactions
- **Network-aware logic**: Check `network.show_active()` against `LOCAL_BLOCKCHAIN_ENVIRONMENTS` or `FORKED_LOCAL_ENVIRONMENT` lists
- **Contract references**: Access the latest deployed contract with `ContractType[-1]` (e.g., `FundMe[-1]`)
- **Source verification**: Controlled per-network via `verify` flag in brownie-config.yaml
- **Inline comments**: Some comments are written in Swedish

## Testing Patterns

- Tests live in `tests/` and use pytest conventions (`test_` prefix)
- Deploy contracts fresh per test via `deploy_fund_me()` from `scripts/deploy.py`
- Use `pytest.raises(exceptions.VirtualMachineError)` for expected reverts
- Network-dependent tests use `pytest.skip()` when not on the appropriate network
- Access control tests create a `bad_actor` account via `accounts.add()`

## Environment Setup

1. Install Brownie: `pip install eth-brownie`
2. Create a `.env` file with `PRIVATE_KEY=0x...` (required for testnet/mainnet deployment)
3. For mainnet-fork testing, configure a fork RPC provider (e.g., Alchemy/Infura) in Brownie's network settings

## Important Notes

- The `build/` directory is gitignored — compiled artifacts are not committed
- The `.env` file is gitignored — never commit private keys
- The default network is `development` (ephemeral local Ganache)
- Price values use 8 decimals from Chainlink, scaled to 18 decimals internally
- The `getEntranceFee()` function adds `+1` to the result to fix a rounding error
