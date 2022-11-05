import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../generated/Controller/Controller";
import { SharePrice, Strategy, Vault } from "../generated/schema";
import { fetchContractDecimal, fetchContractName, fetchContractSymbol } from "./utils/ERC20";
import { loadOrCreateERC20Token } from "./utils/Token";
import { fetchUnderlyingAddress, loadOrCreateVault } from "./utils/Vault";
import { VaultListener } from "../generated/templates";


export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault.toHex();
  const strategyAddress = event.params.strategy.toHex();
  const block = event.block.number;
  const timestamp = event.block.timestamp;
  const sharePrice = new SharePrice(event.transaction.hash.toHex())
  sharePrice.vault = vaultAddress;
  sharePrice.strategy = strategyAddress;
  sharePrice.oldSharePrice = event.params.oldSharePrice;
  sharePrice.newSharePrice = event.params.newSharePrice;
  sharePrice.createAtBlock = block;
  sharePrice.timestamp = timestamp;
  sharePrice.save();
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
