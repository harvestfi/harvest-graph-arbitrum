import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { LastHarvest } from '../../generated/schema';
import { loadOrCreateStrategy } from './Strategy';

export function loadOrCreateLastHarvest(address: Address, tx: string, timestamp: BigInt, block: BigInt): LastHarvest {
  let strategy = loadOrCreateStrategy(address.toHex(), timestamp, block);
  const id = Bytes.fromUTF8(`${strategy.id}-${tx}`)
  let lastHarvest = LastHarvest.load(id)
  if (lastHarvest == null) {
    lastHarvest = new LastHarvest(id);
    lastHarvest.strategy = strategy.id
    lastHarvest.tx = tx;
    lastHarvest.timestamp = timestamp
    lastHarvest.createAtBlock = block
    lastHarvest.save();
  }
  return lastHarvest;
}