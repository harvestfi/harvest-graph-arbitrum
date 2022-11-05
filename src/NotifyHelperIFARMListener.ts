import { loadOrCreatePotPool } from "./utils/PotPool";
import { NotifyPoolsCall } from "../generated/NotifyHelperIFARMListener/NotifyHelperIFARMContract";

export function handlePotNotifyPools(call: NotifyPoolsCall): void {
  const pools = call.inputs.pools
  for (let i = 0; i < pools.length; i++) {
    loadOrCreatePotPool(pools[i], call.block)
  }
}