import { ApyAutoCompound, ApyReward, Pool, Vault } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getPriceByVault, getPriceForCoin } from "../utils/PriceUtils";
import {
  BD_18,
  BD_ONE,
  BD_ONE_HUNDRED,
  BD_TEN,
  BD_ZERO,
  getFarmToken,
  isPsAddress, NULL_ADDRESS,
  SECONDS_OF_YEAR,
  YEAR_PERIOD
} from "../utils/Constant";
import { VaultContract } from "../../generated/Controller/VaultContract";
import { pow } from "../utils/MathUtils";
import { calculateTvlUsd } from "../utils/TvlUtils";

export function saveApyReward(
  poolAddress: Address,
  rewardToken: Address,
  rewardRate: BigInt,
  periodFinish: BigInt,
  tx: ethereum.Transaction,
  block: ethereum.Block
): void {
  let pool = Pool.load(poolAddress.toHex())
  if (pool != null) {
    let vault = Vault.load(pool.vault)
    if (vault != null) {

      if (vault.skipFirstApyReward) {
        vault.skipFirstApyReward = false
        vault.save()
        return
      }
      let rewardRates: BigInt[] = []
      let periodFinishes: BigInt[] = []
      let rewardForPeriods: BigDecimal[] = []
      let prices: BigDecimal[] = []

      let price = BigDecimal.zero()
      if (isPsAddress(pool.vault)) {
        price = getPriceForCoin(getFarmToken()).divDecimal(BD_18)
      } else {
        price = getPriceByVault(vault)
      }

      const tvlUsd = calculateTvlUsd(Address.fromString(vault.id), price)
      const rewardTokenPrice = getPriceForCoin(rewardToken)
      let rewardTokenPriceBD = BigDecimal.zero();
      if (rewardTokenPrice.gt(BigInt.zero())) {
        rewardTokenPriceBD = rewardTokenPrice.divDecimal(BD_18)
      }
      prices.push(rewardTokenPriceBD)
      periodFinishes.push(periodFinish)
      rewardRates.push(rewardRate)
      const period = (periodFinish.minus(block.timestamp)).toBigDecimal()
      const rewardForPeriod = rewardRate.divDecimal(BD_18).times(rewardTokenPriceBD).times(period)
      rewardForPeriods.push(rewardForPeriod)
      const apr = calculateApr(period, rewardForPeriod, tvlUsd)
      const apy = calculateApy(apr)
      const apyReward = new ApyReward(`${tx.hash.toHex()}-${vault.id}`)

      apyReward.periodFinishes = periodFinishes
      apyReward.rewardRates = rewardRates
      apyReward.rewardForPeriods = rewardForPeriods
      apyReward.prices = prices;
      apyReward.apr = apr
      apyReward.apy = apy
      apyReward.tvlUsd = tvlUsd
      apyReward.vault = vault.id
      apyReward.timestamp = block.timestamp
      apyReward.createAtBlock = block.number
      apyReward.save()
    }
  }
}

export function calculateAndSaveApyAutoCompound(id: string, diffSharePrice: BigDecimal, diffTimestamp: BigInt, vaultAddress: string, block: ethereum.Block): BigDecimal {
  let apyAutoCompound = ApyAutoCompound.load(id)
  if (apyAutoCompound == null) {
    apyAutoCompound = new ApyAutoCompound(id)
    apyAutoCompound.createAtBlock = block.number
    apyAutoCompound.timestamp = block.timestamp
    apyAutoCompound.apr = calculateAprAutoCompound(diffSharePrice, diffTimestamp.toBigDecimal())
    apyAutoCompound.apy = calculateApy(apyAutoCompound.apr)
    apyAutoCompound.vault = vaultAddress
    apyAutoCompound.diffSharePrice = diffSharePrice
    apyAutoCompound.diffTimestamp = diffTimestamp.toBigDecimal()
    apyAutoCompound.save()
  }
  return apyAutoCompound.apr
}

export function calculateApr(period: BigDecimal, reward: BigDecimal, tvl: BigDecimal): BigDecimal {
  if (BigDecimal.compare(BD_ZERO, tvl) == 0 || BigDecimal.compare(reward, BD_ZERO) == 0) {
    return BD_ZERO
  }
  const ratio = SECONDS_OF_YEAR.div(period);
  const tempValue = reward.div(tvl)
  return tempValue.times(ratio).times(BD_ONE_HUNDRED)
}

export function calculateAprAutoCompound(diffSharePrice: BigDecimal, diffTimestamp: BigDecimal): BigDecimal {
  if (diffTimestamp.equals(BigDecimal.zero()) || diffTimestamp.equals(BigDecimal.zero())) {
    return BigDecimal.zero()
  }
  return diffSharePrice.div(diffTimestamp).times(BD_ONE_HUNDRED).times(SECONDS_OF_YEAR)
}

export function calculateApy(apr: BigDecimal): BigDecimal {
  if (BigDecimal.compare(BD_ZERO, apr) == 0) {
    return apr
  }
  let tempValue: BigDecimal = apr.div(BD_ONE_HUNDRED)
    .div(YEAR_PERIOD)
    .plus(BD_ONE);

  tempValue = pow(tempValue, 365)
  return tempValue
    .minus(BD_ONE)
    .times(BD_ONE_HUNDRED)
}