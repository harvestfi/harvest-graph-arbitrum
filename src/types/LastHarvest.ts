import { Address, ethereum } from '@graphprotocol/graph-ts';
import { LastHarvest } from '../../generated/schema';
import { loadOrCreateStrategy } from './Strategy';
import { stringIdToBytes } from '../utils/IdUtils';

export function loadOrCreateLastHarvest(address: Address, block: ethereum.Block, tx: ethereum.Transaction): LastHarvest {
  let strategy = loadOrCreateStrategy(address.toHex(), block);
  const id = stringIdToBytes(`${strategy.id}-${tx.hash.toHex()}`);
  let lastHarvest = LastHarvest.load(id)
  if (lastHarvest == null) {
    lastHarvest = new LastHarvest(id);
    lastHarvest.strategy = strategy.id
    lastHarvest.tx = tx.hash.toHex();
    lastHarvest.timestamp = block.timestamp
    lastHarvest.createAtBlock = block.number
    lastHarvest.save();
  }
  return lastHarvest;
}