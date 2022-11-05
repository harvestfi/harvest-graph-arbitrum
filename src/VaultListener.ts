import { Deposit, Withdraw } from "../generated/templates/VaultListener/VaultContract";
import { createTvl } from "./utils/Tvl";

export function handleDeposit(event: Deposit): void {
  createTvl(event.address, event.transaction, event.block)
}

export function handleWithdraw(event: Withdraw): void {
  createTvl(event.address, event.transaction, event.block)
}