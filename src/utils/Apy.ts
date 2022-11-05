import { Apy, Pool, Vault } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { VaultContract } from "../../generated/Controller/VaultContract";
import { getPriceByVault, getPriceForCoin } from "./Price";
import { BD_18, BD_ONE, BD_ONE_HUNDRED, BD_ZERO, SECONDS_OF_YEAR, YEAR_PERIOD } from "./Constant";
import { calculateTvlUsd } from "./Tvl";

export function saveApy(
  poolAddress: Address,
  rewardToken: Address,
  rewardRate: BigInt,
  periodFinish: BigInt,
  rewardAmount: BigInt,
  tx: ethereum.Transaction,
  block: ethereum.Block
): void {
  let pool = Pool.load(poolAddress.toHex())
  if (pool != null) {
    let vault = Vault.load(pool.vault)
    if (vault != null) {

      // TODO for farm token we use tvl instead tvl usd
      const price = getPriceByVault(vault, block.number.toI32())
      const apy = new Apy(`${tx.hash.toHex()}-${vault.id}`)

      apy.periodFinish = periodFinish
      apy.rewardAmount = rewardAmount
      apy.rewardRate = rewardRate
      apy.rewardForPeriod = BigDecimal.zero()
      apy.apr = BigDecimal.zero()
      apy.apy = BigDecimal.zero()
      apy.tvlUsd = BigDecimal.zero()
      if (price.gt(BigDecimal.zero())) {

        const tokenPrice = getPriceForCoin(Address.fromString(pool.rewardTokens[0]), block.number.toI32())
        const period = (periodFinish.minus(block.timestamp)).toBigDecimal()

        if (!tokenPrice.isZero() && !rewardRate.isZero()) {
          apy.rewardForPeriod = rewardRate.divDecimal(BD_18).times(tokenPrice.divDecimal(BD_18)).times(period)
        }

        const tvlUsd = calculateTvlUsd(Address.fromString(vault.id), price, block)
        apy.tvlUsd = tvlUsd
        const apr = calculateApr(period, apy.rewardForPeriod, tvlUsd)
        if (!(BigDecimal.compare(apr, BD_ZERO) == 0)) {
          const apyValue = calculateApy(apr)
          apy.apr = apr
          apy.apy = apyValue
        }
      }
      apy.vault = vault.id
      apy.timestamp = block.timestamp
      apy.createAtBlock = block.number
      apy.priceUnderlying = price
      apy.save()
    }
  }
}

export function calculateApr(period: BigDecimal, reward: BigDecimal, tvl: BigDecimal): BigDecimal {
  if (BigDecimal.compare(BD_ZERO, tvl) == 0 || BigDecimal.compare(reward, BD_ZERO) == 0) {
    return BD_ZERO
  }
  const ratio = SECONDS_OF_YEAR.div(period);
  const tempValue = reward.div(tvl)
  return tempValue.times(ratio).times(BD_ONE_HUNDRED)
}

export function calculateApy(apr: BigDecimal): BigDecimal {
  if (BigDecimal.compare(BD_ZERO, apr) == 0) {
    return apr
  }
  let tempValue: BigDecimal = apr.div(BD_ONE_HUNDRED)
    .times(YEAR_PERIOD)
    .plus(BD_ONE);

  tempValue = tempValue.truncate(365)
  return tempValue
    .minus(BD_ONE)
    .times(BD_ONE_HUNDRED)
}