import { Address, BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { TotalTvl, TotalTvlCount, TotalTvlHistory, TotalTvlHistoryV2, Tvl, Vault } from '../../generated/schema';
import { fetchContractTotalSupply } from "../utils/ERC20Utils";
import { BD_TEN, BD_ZERO, BI_12_HOURS, CONST_ID, getFromTotalAssets, MAX_TVL } from '../utils/Constant';
import { pow } from "../utils/MathUtils";
import { fetchContractTotalAssets, fetchPricePerFullShare } from "../utils/VaultUtils";
import { getPriceByVault } from "../utils/PriceUtils";

export function createTvl(address: Address, timestamp: BigInt = BigInt.zero(), block: BigInt = BigInt.zero()): Tvl | null {
  const vaultAddress = address;
  const vault = Vault.load(vaultAddress.toHex())
  if (vault != null) {
    const id = Bytes.fromUTF8(`${block.toHex()}-${vaultAddress.toHex()}`)
    let tvl = Tvl.load(id)
    if (tvl == null) {
      tvl = new Tvl(id);

      tvl.vault = vault.id
      tvl.timestamp = timestamp
      tvl.createAtBlock = block

      if (getFromTotalAssets(vault.id)) {
        tvl.totalSupply = fetchContractTotalAssets(vaultAddress)
      } else {
        tvl.totalSupply = fetchContractTotalSupply(vaultAddress)
      }

      const decimal = pow(BD_TEN, vault.decimal.toI32())
      tvl.sharePrice = fetchPricePerFullShare(vaultAddress)
      tvl.sharePriceDivDecimal = BigDecimal.fromString(tvl.sharePrice.toString()).div(decimal)
      tvl.decimal = decimal

      if (timestamp.gt(vault.lastPriceUpdate.plus(BI_12_HOURS))) {
        vault.lastPriceUpdate = timestamp
        vault.priceUnderlying = getPriceByVault(vault, timestamp, block)
        vault.priceFeedSequenceId = vault.priceFeedSequenceId + 1;
      }
      tvl.priceUnderlying = vault.priceUnderlying

      if (vault.priceUnderlying.gt(BigDecimal.zero())) {
        tvl.value = tvl.totalSupply.toBigDecimal()
          .div(decimal)
          .times(vault.priceUnderlying)
          .times(tvl.sharePriceDivDecimal)
      } else {
        tvl.value = BD_ZERO;
      }
      tvl.tvlSequenceId = vault.tvlSequenceId;
      tvl.save()

      createTotalTvl(vault.tvl, tvl.value, timestamp, block)
      vault.tvl = tvl.value
      vault.tvlSequenceId = vault.tvlSequenceId + 1;
      vault.save()
    }

    return tvl;
  }

  return null;
}

export function createTotalTvl(oldValue:BigDecimal, newValue: BigDecimal, timestamp: BigInt, block: BigInt): void {
  if (newValue.gt(MAX_TVL)) {
    return;
  }
  const defaultId = '1';
  let totalTvl = TotalTvl.load(defaultId)
  if (totalTvl == null) {
    totalTvl = new TotalTvl(defaultId)
    totalTvl.value = BigDecimal.zero()
    totalTvl.save()
  }

  totalTvl.value = totalTvl.value.minus(oldValue).plus(newValue);
  totalTvl.save()

  createTvlV2(totalTvl.value, timestamp, block);
}

export function createTvlV2(totalTvl: BigDecimal, timestamp: BigInt = BigInt.zero(), block: BigInt = BigInt.zero()): void {
  const id = Bytes.fromUTF8(`${block}`)
  let totalTvlHistory = TotalTvlHistoryV2.load(id)
  if (totalTvlHistory == null) {
    totalTvlHistory = new TotalTvlHistoryV2(id)

    totalTvlHistory.sequenceId = totalTvlUp();
    totalTvlHistory.value = totalTvl
    totalTvlHistory.timestamp = timestamp
    totalTvlHistory.createAtBlock = block
    totalTvlHistory.save()
  }
}

export function totalTvlUp(): BigInt {
  let totalCount = TotalTvlCount.load('1')
  if (!totalCount) {
    totalCount = new TotalTvlCount('1');
    totalCount.length = BigInt.zero();
  }

  totalCount.length = totalCount.length.plus(BigInt.fromString('1'));
  totalCount.save();
  return totalCount.length;
}