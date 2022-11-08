import { Deposit, Withdraw } from "../generated/templates/VaultListener/VaultContract";
import { createTvl } from "./utils/Tvl";
import { Staked, Withdrawn } from "../generated/ExclusiveRewardPoolListener/ExclusiveRewardPoolContract";

export function handleStaked(event: Staked): void {
  createTvl(event.address, event.transaction, event.block)
}

export function handleWithdrawn(event: Withdrawn): void {
  createTvl(event.address, event.transaction, event.block)
}