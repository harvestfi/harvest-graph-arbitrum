import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { TotalTvl, TotalTvlHistory, TotalTvlHistoryV2, Tvl, Vault } from '../../generated/schema';
import { fetchContractTotalSupply } from "../utils/ERC20Utils";
import { BD_TEN, BD_ZERO, CONST_ID, getFromTotalAssets, TVL_NOT_SAVE } from '../utils/Constant';
import { pow } from "../utils/MathUtils";
import { fetchContractTotalAssets, fetchPricePerFullShare } from "../utils/VaultUtils";
import { getPriceByVault } from "../utils/PriceUtils";
import { canCalculateTotalTvlV2, totalTvlUp } from './TotalTvlUtils';
import { stringIdToBytes } from '../utils/IdUtils';

export function createTvl(address: Address, block: ethereum.Block): Tvl | null {
  const vaultAddress = address;
  const vault = Vault.load(vaultAddress.toHex())
  if (vault != null) {
    const id = stringIdToBytes(`${block.number.toHex()}-${vaultAddress.toHex()}`);
    let tvl = Tvl.load(id)
    if (tvl == null) {
      canCalculateTotalTvlV2(block);
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

      const price = getPriceByVault(vault, block)
      tvl.priceUnderlying = price

      if (price.gt(BigDecimal.zero())) {
        tvl.value = tvl.totalSupply.toBigDecimal()
          .div(decimal)
          .times(price)
          .times(tvl.sharePriceDivDecimal)
      } else {
        tvl.value = BD_ZERO;
      }

      if (tvl.value.gt(TVL_NOT_SAVE)) {
        return null;
      }
      tvl.tvlSequenceId = vault.tvlSequenceId;
      tvl.save()

      createTotalTvl(vault.tvl, tvl.value)
      vault.tvl = tvl.value
      vault.priceUnderlying = price
      vault.tvlSequenceId = vault.tvlSequenceId + 1;
      vault.save()
    }

    return tvl;
  }

  return null;
}

export function createTotalTvl(oldValue:BigDecimal, newValue: BigDecimal): void {
  let totalTvl = TotalTvl.load(CONST_ID)
  if (totalTvl == null) {
    totalTvl = new TotalTvl(CONST_ID)
    totalTvl.value = BigDecimal.zero()
    totalTvl.save()
  }

  totalTvl.value = totalTvl.value.minus(oldValue).plus(newValue);
  totalTvl.save()
}

export function createTvlV2(totalTvl: BigDecimal, block: ethereum.Block): void {
  const id = stringIdToBytes(`${block.number.toString()}`);
  let totalTvlHistory = TotalTvlHistoryV2.load(id)
  if (totalTvlHistory == null) {
    totalTvlHistory = new TotalTvlHistoryV2(id)

    totalTvlHistory.sequenceId = totalTvlUp();
    totalTvlHistory.value = totalTvl
    totalTvlHistory.timestamp = block.timestamp
    totalTvlHistory.createAtBlock = block.number
    totalTvlHistory.save()
  }
}