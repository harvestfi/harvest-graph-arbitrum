import { Deposit, Withdraw } from "../generated/templates/VaultListener/VaultContract";
import { createTvl } from "./utils/Tvl";
import { Staked, Withdrawn } from "../generated/ExclusiveRewardPoolListener/ExclusiveRewardPoolContract";
import { saveApyAutoCompound } from "./utils/Apy";

export function handleStaked(event: Staked): void {
  createTvl(event.address, event.transaction, event.block)
  saveApyAutoCompound(event.address, event.block, event.transaction)
}

export function handleWithdrawn(event: Withdrawn): void {
  createTvl(event.address, event.transaction, event.block)
  saveApyAutoCompound(event.address, event.block, event.transaction)
}