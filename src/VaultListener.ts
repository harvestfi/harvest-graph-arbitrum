import { createUserBalance } from "./types/UserBalance";
import { isPool } from "./utils/PotPoolUtils";
import { loadOrCreatePotPool } from "./types/PotPool";
import { createTvl } from "./types/Tvl";
import { Transfer } from "../generated/Controller/VaultContract";
import { PoolCheck } from '../generated/schema';

export function handleTransfer(event: Transfer): void {
  const to = event.params.to
  let poolCheck = PoolCheck.load(to.toHexString());
  if (!poolCheck) {
    if (isPool(to)) {
      loadOrCreatePotPool(to, event.block.timestamp, event.block.number)
    }
    poolCheck = new PoolCheck(to.toHexString());
    poolCheck.save();
  }
  createTvl(event.address, event.block.timestamp, event.block.number)
  createUserBalance(event.address, event.params.value, event.params.from, false, event.transaction.hash.toHex(), event.block.timestamp, event.block.number)
  createUserBalance(event.address, event.params.value, event.params.to, true, event.transaction.hash.toHex(), event.block.timestamp, event.block.number)
}