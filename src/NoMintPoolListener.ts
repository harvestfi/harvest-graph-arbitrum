import { RewardAdded } from "../generated/NoMintNotifyHelperListener/NoMintRewardPoolContract";
import { NoMintPoolContract } from "../generated/templates/NoMintPoolListener/NoMintPoolContract";
import { saveReward } from "./utils/Reward";
import { saveApyReward } from "./utils/Apy";

export function handleRewardAdded(event: RewardAdded): void {
  const poolAddress = event.address
  const poolContract = NoMintPoolContract.bind(poolAddress)
  const rewardAmount = event.params.reward
  const rewardToken = poolContract.rewardToken()
  const rewardRate = poolContract.rewardRate()
  const periodFinish = poolContract.periodFinish()

  saveReward(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
  saveApyReward(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
}