import { Address, ethereum } from '@graphprotocol/graph-ts';
import { Strategy } from "../../generated/schema";
import { StrategyListener } from '../../generated/templates';
import { loadOrCreateVault } from './Vault';
import { StrategyBaseContract } from '../../generated/Controller/StrategyBaseContract';

export function loadOrCreateStrategy(address: string, block: ethereum.Block): Strategy {
  let strategy = Strategy.load(address);
  if (strategy == null) {
    strategy = new Strategy(address);
    strategy.vault = loadOrCreateVault(getVaultAddress(Address.fromString(address)), block).id;
    strategy.timestamp = block.timestamp;
    strategy.createAtBlock = block.number;
    StrategyListener.create(Address.fromString(address));
    strategy.save();
  }
  return strategy
}

export function getVaultAddress(address: Address): Address {
  return StrategyBaseContract.bind(address).vault();
}