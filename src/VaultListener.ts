import { createTvl } from "./utils/Tvl";
import { saveApyAutoCompound } from "./utils/Apy";
import { Transfer } from "../generated/Controller/VaultContract";
import { isPool, loadOrCreatePotPool } from "./utils/PotPool";
import { PotPoolContract } from "../generated/templates/PotPoolListener/PotPoolContract";
import { PotPoolListener } from "../generated/templates";

export function handleTransfer(event: Transfer): void {
  const to = event.params.to
  if (isPool(to)) {
    loadOrCreatePotPool(to, event.block)
    PotPoolListener.create(to)
  }
  createTvl(event.address, event.transaction, event.block)
}