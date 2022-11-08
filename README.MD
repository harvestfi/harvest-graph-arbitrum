# Harvest sub graph 

--- 
## Setup

- Install dependencies `yarn install` 
- Deploy on local machine `graph create --node http://localhost:8020/ harvest-graph`
- Run tests `graph test`


---

## Queries

For query use this urls:
- **Ethereum** - <https://api.thegraph.com/subgraphs/id/QmPRifvkxXjdVMtcFDCd72sLnGE9ZXhg2ep3gNawbSTeVC>
- **Polygon** - TBD
- **BSC** - TBD
- **Arbitrum** - TBD


### Get all vaults
    {
        vaults {
            id
            name
            pool {
                id
            }
            strategy {
                id
            }
            underlying {
                id
                name
                symbol
            }
            decimal
            createAtBlock
            timestamp
        }
    }

### Get last tvl by vault address
- Example for **FARM_USDC**: 0xf0358e8c3cd5fa238a29301d0bea3d63a17bedbe
- Please, use all addresses in **lowercase**


    {
        tvls(
            where: {vault: "0xf0358e8c3cd5fa238a29301d0bea3d63a17bedbe"}
            orderBy: createAtBlock
            orderDirection: desc
        ) {
            value
            totalSupply
            sharePriceDivDecimal
            createAtBlock
        }
    }

- `value` - TVL in usd
- `sharePriceDivDecimal` - `sharePrice` / (10 ** `decimal`)

