import { PotPoolContract, RewardPaid } from '../generated/templates/PotPoolListener/PotPoolContract';
import { BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { saveApyReward } from "./types/Apy";
import { RewardAdded } from "../generated/templates/VaultListener/PotPoolContract";
import { BD_TEN, BI_EVERY_24_HOURS } from './utils/Constant';
import { pow } from './utils/MathUtils';
import { getTokenInPrice, loadOrCreateERC20Token } from './types/Token';
import { loadOrCreatePotPool } from './types/PotPool';
import { store } from '@graphprotocol/graph-ts';
import { Reward, RewardPaidEntity, TokenPrice } from '../generated/schema';

export function handleRewardAdded(event: RewardAdded): void {
  const poolAddress = event.address

  const poolContract = PotPoolContract.bind(poolAddress)
  const tx = event.transaction.hash.toHex()
  const rewardAmount = event.params.reward
  const rewardToken = event.params.rewardToken
  const rewardRate = poolContract.rewardRate()
  const periodFinish = poolContract.periodFinish()

  // create reward
  const reward = new Reward(Bytes.fromUTF8(`${tx}-${poolAddress.toHex()}-${event.params.rewardToken.toHex()}`))
  reward.timestamp = event.block.timestamp
  reward.pool = poolAddress.toHex()
  reward.token = rewardToken.toHex()
  reward.rewardRate = rewardRate
  reward.periodFinish = periodFinish
  reward.reward = rewardAmount
  reward.tx = tx
  reward.save()

  // create apy reward
  saveApyReward(poolAddress, rewardToken, rewardRate, periodFinish, event.block.timestamp, event.block.number)
}

export function handleRewardPaid(event: RewardPaid): void {
  const rewardPaid = new RewardPaidEntity(Bytes.fromUTF8(`${event.transaction.hash.toHex()}-${event.logIndex.toString()}`));
  rewardPaid.userAddress = event.params.user.toHexString();
  rewardPaid.pool = loadOrCreatePotPool(event.address, event.block.timestamp, event.block.number).id;
  rewardPaid.value = event.params.reward;
  // price
  const rewardToken = loadOrCreateERC20Token(event.params.rewardToken);
  const tokenPriceId = event.params.rewardToken.toHexString();
  let tokenPrice = TokenPrice.load(tokenPriceId);
  if (!tokenPrice) {
    tokenPrice = new TokenPrice(tokenPriceId);
    const price = getTokenInPrice(event.params.rewardToken, event.block.timestamp).price;
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