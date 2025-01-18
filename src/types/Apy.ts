import { ApyAutoCompound, ApyReward, GeneralApy, Pool, Vault } from '../../generated/schema';
import { Address, BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import {
  BD_18,
  BD_ONE,
  BD_ONE_HUNDRED,
  BD_TEN,
  BD_ZERO,
  getFarmToken,
  isPsAddress, MAX_APY_REWARD, NULL_ADDRESS,
  SECONDS_OF_YEAR,
  YEAR_PERIOD,
} from '../utils/Constant';
import { pow } from "../utils/MathUtils";
import { loadOrCreatePotPool } from './PotPool';
import { loadOrCreateVault } from './Vault';
import { getTokenInPrice } from './Token';

export function saveApyReward(
  poolAddress: Address,
  rewardToken: Address,
  rewardRate: BigInt,
  periodFinish: BigInt,
  timestamp: BigInt,
  block: BigInt
): void {
  const pool = loadOrCreatePotPool(poolAddress, timestamp, block)
  let vault = loadOrCreateVault(pool.vault, timestamp, block)
  if (vault.skipFirstApyReward) {
    vault.skipFirstApyReward = false
    vault.save()
    return
  }

  const rewardTokenPrice = getTokenInPrice(rewardToken, timestamp).price
  let rewardTokenPriceBD = BigDecimal.zero();
  if (rewardTokenPrice.gt(BigInt.zero())) {
    rewardTokenPriceBD = rewardTokenPrice.divDecimal(BD_18)
  }
  const period = (periodFinish.minus(timestamp)).toBigDecimal()
  const rewardForPeriod = rewardRate.divDecimal(BD_18).times(rewardTokenPriceBD).times(period)
  const apr = calculateApr(period, rewardForPeriod, vault.tvl)
  const apy = calculateApy(apr)
  if (apy.gt(MAX_APY_REWARD)) {
    return;
  }
  const apyReward = new ApyReward(Bytes.fromUTF8(`${timestamp}-${vault.id}`))

  apyReward.periodFinishes = periodFinish
  apyReward.rewardRates = rewardRate
  apyReward.rewardForPeriods = rewardForPeriod
  apyReward.prices = rewardTokenPriceBD;
  apyReward.apr = apr
  apyReward.apy = apy
  apyReward.tvlUsd = vault.tvl
  apyReward.vault = vault.id
  apyReward.timestamp = timestamp
  apyReward.createAtBlock = block
  apyReward.save()

  vault.apyReward = apy;
  vault.apy = vault.apyAutoCompound.plus(vault.apyReward)
  vault.save();
  calculateGeneralApy(vault, timestamp, block);
}

export function calculateAndSaveApyAutoCompound(id: Bytes, diffSharePrice: BigDecimal, diffTimestamp: BigInt, vault: Vault, timestamp: BigInt, block: BigInt): BigDecimal {
  let apyAutoCompound = ApyAutoCompound.load(id)
  if (apyAutoCompound == null) {
    apyAutoCompound = new ApyAutoCompound(id)
    apyAutoCompound.createAtBlock = block
    apyAutoCompound.timestamp = timestamp
    apyAutoCompound.apr = calculateAprAutoCompound(diffSharePrice, diffTimestamp.toBigDecimal())
    const apy = calculateApy(apyAutoCompound.apr);
    apyAutoCompound.apy = apy;
    apyAutoCompound.vault = vault.id
    apyAutoCompound.diffSharePrice = diffSharePrice
    apyAutoCompound.diffTimestamp = diffTimestamp.toBigDecimal()
    apyAutoCompound.save()

    vault.apyAutoCompound = apy;
    vault.apy = vault.apyAutoCompound.plus(vault.apyReward)
    calculateGeneralApy(vault, timestamp, block);
  }
  return apyAutoCompound.apr
}

export function calculateGeneralApy(vault: Vault, timestamp: BigInt, block: BigInt): void {
  const id = Bytes.fromUTF8(`${vault.id}-${block}`);
  let generalApy = GeneralApy.load(id)
  if (!generalApy) {
    generalApy = new GeneralApy(id);
    generalApy.createAtBlock = block
    generalApy.timestamp = timestamp;
    generalApy.apy = vault.apy;
    generalApy.vault = vault.id;
    generalApy.apyReward = vault.apyReward
    generalApy.apyAutoCompound = vault.apyAutoCompound
    generalApy.save();
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