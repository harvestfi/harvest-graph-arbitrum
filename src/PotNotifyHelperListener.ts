import { NotifyPoolsCall } from "../generated/PotNotifyHelperListener/PotNotifyHelperContract";
import { loadOrCreatePotPool } from "./utils/PotPool";

export function handlePotNotifyPools(call: NotifyPoolsCall): void {
  const pools = call.inputs.pools
  for (let i = 0; i < pools.length; i++) {
    loadOrCreatePotPool(pools[i], call.block)
  }
}