import { Address, BigInt } from "@graphprotocol/graph-ts";
import { NULL_ADDRESS } from "./Constant";
import { PotPoolContract } from "../../generated/templates/VaultListener/PotPoolContract";

export function isPool(address: Address): boolean {
  const pool = PotPoolContract.bind(address)
  return pool.try_lpToken().reverted == false
}

export function fetchRewardTokenLength(address: Address): BigInt {
  const pool = PotPoolContract.bind(address)
  const tryRewardTokenLength = pool.try_rewardTokensLength()
  return tryRewardTokenLength.reverted ? BigInt.fromI32(1) : tryRewardTokenLength.value
}

export function fetchRewardTokenById(address: Address, index: BigInt): Address {
  const pool = PotPoolContract.bind(address);
  const tryRewardToken = pool.try_rewardTokens(index)
  return tryRewardToken.reverted ? NULL_ADDRESS : tryRewardToken.value
}

export function fetchRewardToken(address: Address): Address {
  const pool = PotPoolContract.bind(address);
  const tryRewardToken = pool.try_rewardToken()
  return tryRewardToken.reverted ? NULL_ADDRESS : tryRewardToken.value
}

export function fetchRewardRateForToken(address: Address, token: Address): BigInt {
  const pool = PotPoolContract.bind(address);
  const tryRewardRateForToken = pool.try_rewardRateForToken(token)
  return tryRewardRateForToken.reverted ? BigInt.zero() : tryRewardRateForToken.value
}

export function fetchRewardRate(address: Address): BigInt {
  const pool = PotPoolContract.bind(address);
  const tryRewardRateForToken = pool.try_rewardRate()
  return tryRewardRateForToken.reverted ? BigInt.zero() : tryRewardRateForToken.value
}

export function fetchPeriodFinishForToken(address: Address, token: Address): BigInt {
  const pool = PotPoolContract.bind(address);
  const tryRewardRateForToken = pool.try_periodFinishForToken(token)
  return tryRewardRateForToken.reverted ? BigInt.zero() : tryRewardRateForToken.value
}