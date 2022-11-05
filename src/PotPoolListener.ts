import { RewardAdded } from "../generated/PotNotifyHelperListener/PotPoolContract";
import { PotPoolContract } from "../generated/templates/PotPoolListener/PotPoolContract";
import { saveReward } from "./utils/Reward";
import { saveApy } from "./utils/Apy";

export function handleRewardAdded(event: RewardAdded): void {
  const poolAddress = event.address
  const poolContract = PotPoolContract.bind(poolAddress)
  const rewardToken = poolContract.rewardToken()
  const rewardAmount = event.params.reward
  const rewardRate = poolContract.rewardRate()
  const periodFinish = poolContract.periodFinish()

  saveReward(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
  saveApy(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
}
