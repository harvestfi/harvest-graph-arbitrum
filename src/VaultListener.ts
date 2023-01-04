import { createTvl } from "./utils/Tvl";
import { saveApyAutoCompound } from "./utils/Apy";
import { Deposit, Invest, Transfer, Withdraw } from "../generated/Controller/VaultContract";
import { isPool, loadOrCreatePotPool } from "./utils/PotPool";
import { PotPoolContract } from "../generated/templates/PotPoolListener/PotPoolContract";
import { PotPoolListener } from "../generated/templates";
import { createUserBalance } from "./utils/Vault";
import { Approval } from "../generated/Controller/ERC20";

export function handleTransfer(event: Transfer): void {
  const to = event.params.to
  if (isPool(to)) {
    loadOrCreatePotPool(to, event.block)
    PotPoolListener.create(to)
  }
  createTvl(event.address, event.transaction, event.block)
}

export function handleDeposit(event: Deposit): void {
  createUserBalance(event.address, event.params.amount, event.params.beneficiary, event.transaction, event.block, true)
}

export function handleWithdraw(event: Withdraw): void {
  createUserBalance(event.address, event.params.amount, event.params.beneficiary, event.transaction, event.block, false)
}

export function handleInvest(event: Invest): void {
  createTvl(event.address, event.transaction, event.block)
}

export function handleApproval(event: Approval): void {
  createTvl(event.address, event.transaction, event.block)
}