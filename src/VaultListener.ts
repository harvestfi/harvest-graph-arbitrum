import { Deposit, Withdraw } from "../generated/templates/VaultListener/VaultContract";
import { createTvl } from "./utils/Tvl";
import { saveApyAutoCompound } from "./utils/Apy";

export function handleDeposit(event: Deposit): void {
  createTvl(event.address, event.transaction, event.block)
  saveApyAutoCompound(event.address, event.block, event.transaction)
}

export function handleWithdraw(event: Withdraw): void {
  createTvl(event.address, event.transaction, event.block)
  saveApyAutoCompound(event.address, event.block, event.transaction)
}