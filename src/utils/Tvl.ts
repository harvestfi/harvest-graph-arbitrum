import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Tvl, Vault } from "../../generated/schema";
import { fetchContractDecimal, fetchContractTotalSupply } from "./ERC20";
import { getPriceByVault, getPriceForCoin } from "./Price";
import { BD_18, BD_ZERO, BI_18, SECONDS_OF_YEAR, YEAR_PERIOD } from "./Constant";
import { fetchPricePerFullShare } from "./Vault";

// TODO for LP change logic
export function createTvl(address: Address, transaction: ethereum.Transaction, block: ethereum.Block): void {
  const vaultAddress = address;
  const vault = Vault.load(vaultAddress.toHex())
  if (vault != null) {
    const id = `${transaction.hash.toHex()}-${vaultAddress.toHex()}`
    let tvl = Tvl.load(id)
    if (tvl == null) {
      tvl = new Tvl(id);

      tvl.vault = vault.id
      tvl.timestamp = block.timestamp
      tvl.createAtBlock = block.number
      tvl.totalSupply = fetchContractTotalSupply(vaultAddress)

      const decimal = BigDecimal.fromString((10 ** vault.decimal.toI64()).toString())
      tvl.sharePrice = fetchPricePerFullShare(vaultAddress)
      tvl.sharePriceDivDecimal = BigDecimal.fromString(tvl.sharePrice.toString()).div(decimal)
      tvl.decimal = decimal

      const price = getPriceByVault(vault, block.number.toI32())
      tvl.priceUnderlying = price

      if (price.gt(BigDecimal.zero())) {
        tvl.value = tvl.totalSupply.toBigDecimal()
          .div(decimal)
          .times(price)
          .times(tvl.sharePriceDivDecimal)
      } else {
        tvl.value = BD_ZERO;
      }
      tvl.save()
    }
  }
}

export function calculateTvlUsd(vaultAddress: Address, price: BigDecimal): BigDecimal {
  if (price.le(BigDecimal.zero())) {
    return BD_ZERO
  }
  const totalSupply = fetchContractTotalSupply(vaultAddress).toBigDecimal()
  const decimal = fetchContractDecimal(vaultAddress)
  const tempDecimal = BigDecimal.fromString((10 ** decimal.toI64()).toString())
  const sharePriceDivDecimal = fetchPricePerFullShare(vaultAddress).toBigDecimal().div(tempDecimal)

  return totalSupply.div(tempDecimal).times(price).times(sharePriceDivDecimal)
}