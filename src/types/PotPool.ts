import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Pool, Vault } from "../../generated/schema";
import { PotPoolListener } from "../../generated/templates";
import { loadOrCreateVault } from "./Vault";
import { loadOrCreateERC20Token } from "./Token";
import { PotPoolContract } from "../../generated/templates/VaultListener/PotPoolContract";

const TYPE = 'PotPool'


export function loadOrCreatePotPool(poolAddress: Address, timestamp: BigInt, block: BigInt): Pool {
  let pool = Pool.load(poolAddress.toHex())
  if (pool == null) {
    let poolContract = PotPoolContract.bind(poolAddress)
    let vaultAddress = poolContract.lpToken();
    let tryRewardToken = poolContract.try_rewardToken();
    let rewardTokens: string[] = [];
    if (!tryRewardToken.reverted) {
      let rewardToken = loadOrCreateERC20Token(tryRewardToken.value)
      rewardTokens = [rewardToken.id];
    }
    pool = new Pool(poolAddress.toHex())
    pool.timestamp = timestamp
    pool.createAtBlock = block
    pool.vault = vaultAddress.toHex()
    pool.type = TYPE
    pool.rewardTokens = rewardTokens
    pool.save()

    const vault = loadOrCreateVault(vaultAddress.toHex(), timestamp, block)
    vault.pool = poolAddress.toHex()
    vault.save()
    PotPoolListener.create(poolAddress);
  }
  return pool;
}