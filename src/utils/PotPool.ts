import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Pool, Vault } from "../../generated/schema";
import { loadOrCreateERC20Token } from "./Token";
import { PotPoolContract } from "../../generated/PotNotifyHelperListener/PotPoolContract";
import { PotPoolListener } from "../../generated/templates";
import { loadOrCreateVault } from "./Vault";

export function loadOrCreatePotPool(poolAddress: Address, ethBlock: ethereum.Block): void {
  let pool = Pool.load(poolAddress.toHex())
  if (pool == null) {
    let poolContract = PotPoolContract.bind(poolAddress)
    let vaultAddress = poolContract.lpToken();
    let rewardTokenAddress = poolContract.rewardToken();
    let rewardToken = loadOrCreateERC20Token(rewardTokenAddress)
    let pool = new Pool(poolAddress.toHex())
    pool.timestamp = ethBlock.timestamp
    pool.createAtBlock = ethBlock.number
    pool.vault = vaultAddress.toHex()
    pool.type = 'PotPool'
    pool.rewardTokens = [rewardToken.id]
    pool.save()

    let vault = Vault.load(vaultAddress.toHex())
    if (vault != null) {
      vault.pool = poolAddress.toHex()
      vault.save()
    } else {
      vault = loadOrCreateVault(vaultAddress, ethBlock)
      vault.pool = poolAddress.toHex()
      vault.save()
    }
    PotPoolListener.create(poolAddress);
  }
}