import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Strategy } from "../../generated/schema";
import { StrategyListener } from '../../generated/templates';
import { loadOrCreateVault } from './Vault';
import { StrategyBaseContract } from '../../generated/Controller/StrategyBaseContract';

export function loadOrCreateStrategy(address: string, timestamp: BigInt = BigInt.zero(), block: BigInt = BigInt.zero(), vault: string = ''): Strategy {
  let strategy = Strategy.load(address);
  if (strategy == null) {
    strategy = new Strategy(address);
    strategy.vault = loadOrCreateVault(vault != '' ? vault : getVaultAddress(Address.fromString(address)).toHexString()).id;
    strategy.timestamp = timestamp;
    strategy.createAtBlock = block;
    strategy.save();
    StrategyListener.create(Address.fromString(address));
  }
  return strategy
}

export function getVaultAddress(address: Address): Address {
  return StrategyBaseContract.bind(address).vault();
}