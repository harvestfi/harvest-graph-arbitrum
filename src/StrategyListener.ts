import { ProfitLogInReward } from '../generated/templates/StrategyListener/StrategyBaseContract';
import { loadOrCreateLastHarvest } from './types/LastHarvest';


export function handleProfitLogInReward(event: ProfitLogInReward): void {
  loadOrCreateLastHarvest(event.address, event.block, event.transaction);
}