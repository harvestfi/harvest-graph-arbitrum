import { saveReward } from "./utils/Reward";
import { saveApyReward } from "./utils/Apy";
import {
  ExclusiveRewardPoolContract, InitExclusiveCall,
  RewardAdded
} from "../generated/ExclusiveRewardPoolListener/ExclusiveRewardPoolContract";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { AutoStake, Pool, Vault } from "../generated/schema";
import { loadOrCreateERC20Token } from "./utils/Token";
import { loadOrCreateVault } from "./utils/Vault";
import { AutoStakeListner } from "../generated/templates";

export function handleRewardAdded(event: RewardAdded): void {
  const poolAddress = event.address
  initExcludeRewardPool(poolAddress.toHex(), event.block)
  const poolContract = ExclusiveRewardPoolContract.bind(poolAddress)
  const rewardAmount = event.params.reward
  const rewardToken = poolContract.rewardToken()
  const rewardRate = poolContract.rewardRate()
  const periodFinish = poolContract.periodFinish()

  saveReward(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
  saveApyReward(poolAddress, rewardToken, rewardRate, periodFinish, rewardAmount, event.transaction, event.block)
}

export function handleInitExclusive(call: InitExclusiveCall): void {
  const autoStakeAddress = call.inputs._exclusive
  let autoStack = AutoStake.load(autoStakeAddress.toHex())
  if (autoStack == null) {
    autoStack = new AutoStake(autoStakeAddress.toHex())
    autoStack.timestamp = call.block.timestamp
    autoStack.createAtBlock = call.block.number
    autoStack.save()
    AutoStakeListner.create(autoStakeAddress)
  }
}

function initExcludeRewardPool(poolAddress: string, block: ethereum.Block): void {
  let pool = Pool.load(poolAddress)
  if (pool == null) {
    let poolContract = ExclusiveRewardPoolContract.bind(Address.fromString(poolAddress))
    let vaultAddress = poolContract.lpToken();
    let rewardTokenAddress = poolContract.rewardToken();
    let rewardToken = loadOrCreateERC20Token(rewardTokenAddress)
    let pool = new Pool(poolAddress)
    pool.timestamp = block.timestamp
    pool.createAtBlock = block.number
    pool.vault = vaultAddress.toHex()
    pool.type = 'ExclusiveRewardPool'
    pool.rewardTokens = [rewardToken.id]
    pool.save()

    let vault = Vault.load(vaultAddress.toHex())
    if (vault != null) {
      vault.pool = poolAddress
      vault.save()
    } else {
      vault = loadOrCreateVault(vaultAddress, block)
      vault.pool = poolAddress
      vault.save()
    }

  }
}