import { PotPoolContract, RewardPaid } from '../generated/templates/PotPoolListener/PotPoolContract';
import { saveReward } from "./types/Reward";
import { BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { saveApyReward } from "./types/Apy";
import { RewardAdded } from "../generated/templates/VaultListener/PotPoolContract";
import { BD_TEN, BI_EVERY_24_HOURS } from './utils/Constant';
import { pow } from './utils/MathUtils';
import { getPriceForCoin } from './utils/PriceUtils';
import { loadOrCreateERC20Token } from './types/Token';
import { loadOrCreatePotPool } from './types/PotPool';
import { store } from '@graphprotocol/graph-ts';
import { RewardPaidEntity, TokenPrice } from '../generated/schema';

export function handleRewardAdded(event: RewardAdded): void {
  const poolAddress = event.address
  const rewardAmount = event.params.reward

  const poolContract = PotPoolContract.bind(poolAddress)
  const tryRewardToken = poolContract.try_rewardToken()
  const tryRewardRate = poolContract.try_rewardRate()
  const tryPeriodFinish = poolContract.try_periodFinish()

  if (tryPeriodFinish.reverted) {
    log.log(log.Level.WARNING, `Can not get periodFinish, handleRewardAdded on ${poolAddress}`)
  }

  if (tryRewardToken.reverted) {
    log.log(log.Level.WARNING, `Can not get rewardToken, handleRewardAdded on ${poolAddress}`)
  }

  if (tryRewardRate.reverted) {
    log.log(log.Level.WARNING, `Can not get rewardRate, handleRewardAdded on ${poolAddress}`)
  }

  saveReward(poolAddress, tryRewardToken.value, tryRewardRate.value, tryPeriodFinish.value, rewardAmount, event.transaction, event.block)
  saveApyReward(poolAddress, tryRewardToken.value, tryRewardRate.value, tryPeriodFinish.value, event.transaction, event.block)
}

export function handleRewardPaid(event: RewardPaid): void {
  const rewardPaid = new RewardPaidEntity(Bytes.fromUTF8(`${event.transaction.hash.toHex()}-${event.logIndex.toString()}`));
  rewardPaid.userAddress = event.params.user.toHexString();
  rewardPaid.pool = loadOrCreatePotPool(event.address, event.block).id;
  rewardPaid.value = event.params.reward;
  // price
  const rewardToken = loadOrCreateERC20Token(event.params.rewardToken);
  // TODO move logic token price for all project
  const tokenPriceId = event.params.rewardToken.toHexString();
  let tokenPrice = TokenPrice.load(tokenPriceId);
  if (tokenPrice == null) {
    tokenPrice = new TokenPrice(tokenPriceId);
    const price = getPriceForCoin(event.params.rewardToken);
    let priceBD = BigDecimal.zero();

    if (price.gt(BigInt.zero())) {
      priceBD = price.divDecimal(pow(BD_TEN, rewardToken.decimals));
    }
    tokenPrice.price = priceBD;
    tokenPrice.timestamp = event.block.timestamp;
    tokenPrice.save();
  }

  rewardPaid.price = tokenPrice.price;
  rewardPaid.token = rewardToken.id;
  rewardPaid.timestamp = event.block.timestamp;
  rewardPaid.createAtBlock = event.block.number;
  rewardPaid.save();

  if (tokenPrice.timestamp.plus(BI_EVERY_24_HOURS).lt(event.block.timestamp)) {
    store.remove('TokenPrice', tokenPriceId);
  }
}