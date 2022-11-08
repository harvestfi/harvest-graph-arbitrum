import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../generated/Controller/Controller";
import { SharePrice, Strategy, Vault } from "../generated/schema";
import { loadOrCreateVault } from "./utils/Vault";
import { pow, powBI } from "./utils/Math";
import { BD_TEN, BI_TEN } from "./utils/Constant";
import { calculateAndSaveApyAutoCompound } from "./utils/Apy";


export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault.toHex();
  const strategyAddress = event.params.strategy.toHex();
  const block = event.block.number;
  const timestamp = event.block.timestamp;
  const sharePrice = new SharePrice(`${event.transaction.hash.toHex()}-${vaultAddress}`)
  sharePrice.vault = vaultAddress;
  sharePrice.strategy = strategyAddress;
  sharePrice.oldSharePrice = event.params.oldSharePrice;
  sharePrice.newSharePrice = event.params.newSharePrice;
  sharePrice.createAtBlock = block;
  sharePrice.timestamp = timestamp;
  sharePrice.save();

  const vault = Vault.load(vaultAddress)
  if (vault != null) {
    const lastShareTimestamp = vault.lastShareTimestamp
    if (!lastShareTimestamp.isZero()) {
      const diffSharePrice = sharePrice.newSharePrice.minus(sharePrice.oldSharePrice).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
      const diffTimestamp = timestamp.minus(lastShareTimestamp)
      calculateAndSaveApyAutoCompound(`${event.transaction.hash.toHex()}-${vaultAddress}`, diffSharePrice, diffTimestamp, vaultAddress, event.block)
    }
    vault.lastShareTimestamp = sharePrice.timestamp
    vault.save()

  }
}

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  const vaultAddress = call.inputs._vault;
  const strategyAddress = call.inputs._strategy;
  const block = call.block.number;
  const timestamp = call.block.timestamp;

  let strategy = Strategy.load(strategyAddress.toHex());
  if (strategy == null) {
    strategy = new Strategy(strategyAddress.toHex());
  }
  strategy.timestamp = timestamp;
  strategy.createAtBlock = block;
  strategy.save();

  loadOrCreateVault(vaultAddress, call.block, strategy.id)
}
