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
import {
  fetchPeriodFinishForToken,
  fetchRewardRateForToken,
  fetchRewardToken,
  fetchRewardTokenLength
} from "../utils/PotPoolUtils";

export function saveApyAutoCompound(vaultAddress: Address, block: ethereum.Block, tx: ethereum.Transaction): void {
  const vault = Vault.load(vaultAddress.toHex())
  if (vault != null) {
    const vaultContract = VaultContract.bind(vaultAddress)
    const tryPriceShare = vaultContract.try_getPricePerFullShare()
    if (!tryPriceShare.reverted) {
      const newSharePrice = tryPriceShare.value
      if (!vault.lastSharePrice.isZero()) {
        const timestamp = block.timestamp
        const diffSharePrice = newSharePrice.minus(vault.lastSharePrice).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
        const diffTimeStamp = timestamp.minus(vault.lastShareTimestamp)
        calculateAndSaveApyAutoCompound(`${tx.hash}-${vault.id}`, diffSharePrice, diffTimeStamp, vault.id, block)
        vault.lastShareTimestamp = timestamp
        vault.lastSharePrice = newSharePrice
        vault.save()
      }
    }
  }
}

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

      if (vault.skipFirstApyReward == true) {
        vault.skipFirstApyReward = false
        vault.save()
        return
      }
      let rewardRates: BigInt[] = []
      let periodFinishes: BigInt[] = []
      let rewardForPeriods: BigDecimal[] = []
      let prices: BigDecimal[] = []

      let apr = BigDecimal.zero()
      let apy = BigDecimal.zero()

      let price = BigDecimal.zero()
      if (isPsAddress(pool.vault)) {
        price = getPriceForCoin(getFarmToken()).divDecimal(BD_18)
      } else {
        price = getPriceByVault(vault)
      }

      const tvlUsd = calculateTvlUsd(Address.fromString(vault.id), price)

      const tokenLength = fetchRewardTokenLength(poolAddress)
      for (let i=0;i<tokenLength.toI32();i++) {
        const rewardToken = fetchRewardToken(poolAddress, BigInt.fromI32(i));
        if (rewardToken == NULL_ADDRESS) {
          continue;
        }
        const rewardRate = fetchRewardRateForToken(poolAddress, rewardToken);
        if (rewardRate == BigInt.zero()) {
          continue;
        }
        const periodFinish = fetchPeriodFinishForToken(poolAddress, rewardToken)
        if (periodFinish == BigInt.zero()) {
          continue;
        }
        const price = getPriceForCoin(rewardToken)
        const period = (periodFinish.minus(block.timestamp)).toBigDecimal()

        if (period.gt(BigDecimal.zero()) && price.gt(BigInt.zero())) {
          const priceBD = price.divDecimal(BD_18)
          const rewardForPeriod = rewardRate.divDecimal(BD_18).times(priceBD).times(period)

          rewardRates.push(rewardRate)
          periodFinishes.push(periodFinish)
          rewardForPeriods.push(rewardForPeriod)
          prices.push(priceBD)

          const aprTemp = calculateApr(period, rewardForPeriod, tvlUsd)
          const apyTemp = calculateApy(aprTemp)

          apr = apr.plus(aprTemp)
          apy = apy.plus(apyTemp)
        }
      }


      const apyReward = new ApyReward(`${tx.hash.toHex()}-${vault.id}`)

      apyReward.periodFinishes = periodFinishes
      apyReward.rewardRates = rewardRates
      apyReward.rewardForPeriods = rewardForPeriods
      apyReward.apr = apr
      apyReward.apy = apy
      apyReward.tvlUsd = tvlUsd
      // if (price.gt(BigDecimal.zero())) {
      //
      //   const tokenPrice = getPriceForCoin(Address.fromString(pool.rewardTokens[0]), block.number.toI32())
      //   const period = (periodFinish.minus(block.timestamp)).toBigDecimal()
      //
      //   if (!tokenPrice.isZero() && !rewardRate.isZero()) {
      //     apyReward.rewardForPeriod = rewardRate.divDecimal(BD_18).times(tokenPrice.divDecimal(BD_18)).times(period)
      //   }
      //
      //   const tvlUsd = calculateTvlUsd(Address.fromString(vault.id), price)
      //   apyReward.tvlUsd = tvlUsd
      //   const apr = calculateApr(period, apyReward.rewardForPeriod, tvlUsd)
      //   if (!(BigDecimal.compare(apr, BD_ZERO) == 0)) {
      //     const apyValue = calculateApy(apr)
      //     apyReward.apr = apr
      //     apyReward.apy = apyValue
      //   }
      // }

      if (apyReward.apy.le(BigDecimal.zero())) {
        // don't save 0 APY
        return;
      }
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