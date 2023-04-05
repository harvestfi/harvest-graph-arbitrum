import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { TotalTvl, TotalTvlHistory, Tvl, Vault } from "../../generated/schema";
import { fetchContractTotalSupply } from "../utils/ERC20Utils";
import { BD_TEN, BD_ZERO, getFromTotalAssets } from "../utils/Constant";
import { pow } from "../utils/MathUtils";
import { fetchContractTotalAssets, fetchPricePerFullShare } from "../utils/VaultUtils";
import { getPriceByVault } from "../utils/PriceUtils";

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

      if (getFromTotalAssets(vault.id)) {
        tvl.totalSupply = fetchContractTotalAssets(vaultAddress)
      } else {
        tvl.totalSupply = fetchContractTotalSupply(vaultAddress)
      }

      const decimal = pow(BD_TEN, vault.decimal.toI32())
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

      createTotalTvl(vault.tvl, tvl.value, id, block)
      vault.tvl = tvl.value
      vault.save()
    }
  }
}

export function createTotalTvl(oldValue:BigDecimal, newValue: BigDecimal, id: string, block: ethereum.Block): void {
  const defaultId = '1';
  let totalTvl = TotalTvl.load(defaultId)
  if (totalTvl == null) {
    totalTvl = new TotalTvl(defaultId)
    totalTvl.value = BigDecimal.zero()
    totalTvl.save()
  }

  totalTvl.value = totalTvl.value.minus(oldValue).plus(newValue);
  totalTvl.save()

  let totalTvlHistory = TotalTvlHistory.load(id)
  if (totalTvlHistory == null) {
    totalTvlHistory = new TotalTvlHistory(id)

    totalTvlHistory.value = totalTvl.value
    totalTvlHistory.timestamp = block.timestamp
    totalTvlHistory.createAtBlock = block.number
    totalTvlHistory.save()
  }
}