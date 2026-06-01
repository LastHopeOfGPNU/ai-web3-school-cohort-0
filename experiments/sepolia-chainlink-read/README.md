# Sepolia Chainlink Read

Minimal testnet contract interaction using a read-only JSON-RPC `eth_call`.

## Target

- Network: Ethereum Sepolia testnet
- Contract: Chainlink ETH/USD Price Feed
- Address: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- Explorer: <https://sepolia.etherscan.io/address/0x694AA1769357215DE4FAC081bf1f309aDC325306>

## Run

```bash
npm run read
```

Optional custom RPC:

```bash
RPC_URL=https://your-sepolia-rpc.example npm run read
```

## What It Calls

- `decimals()`
- `description()`
- `latestRoundData()`

These are read-only calls. They do not create a transaction, spend test ETH, or require wallet approval.
