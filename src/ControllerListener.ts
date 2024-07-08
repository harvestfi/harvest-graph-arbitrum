import { PriceHistory, SharePrice, Strategy, Vault, VaultHistory } from '../generated/schema';
import { getVaultUtils, loadOrCreateVault } from './types/Vault';
import { pow, powBI } from "./utils/MathUtils";
import {
  BD_TEN,
  BI_EVERY_24_HOURS, BI_EVERY_7_DAYS,
  BI_TEN,
  EVERY_24_HOURS,
  EVERY_7_DAYS,
  MODULE_RESULT,
  MODULE_RESULT_V2, TWO_WEEKS_IN_SECONDS,
} from './utils/Constant';
import { SharePriceChangeLog } from "../generated/Controller/ControllerContract";
import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { calculateAndSaveApyAutoCompound } from "./types/Apy";


export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault.toHex();
  const strategyAddress = event.params.strategy.toHex();
  const block = event.block.number;
  const timestamp = event.block.timestamp;
  const sharePrice = new SharePrice(`${event.transaction.hash.toHex()}-${vaultAddress}`)
  let vault = Vault.load(vaultAddress)
  if (vault == null) {
    vault = loadOrCreateVault(Address.fromString(vaultAddress), event.block, strategyAddress)
  }
  sharePrice.vault = vaultAddress;
  sharePrice.strategy = strategyAddress;
  sharePrice.oldSharePrice = event.params.oldSharePrice;
  sharePrice.newSharePrice = event.params.newSharePrice;
  sharePrice.createAtBlock = block;
  sharePrice.timestamp = timestamp;
  sharePrice.save();

  if (vault != null) {
    if (sharePrice.oldSharePrice != sharePrice.newSharePrice) {
      const lastShareTimestamp = vault.lastShareTimestamp
      if (!lastShareTimestamp.isZero()) {
        const diffSharePrice = sharePrice.newSharePrice.minus(sharePrice.oldSharePrice).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
        const diffTimestamp = timestamp.minus(lastShareTimestamp)
        calculateAndSaveApyAutoCompound(`${event.transaction.hash.toHex()}-${vaultAddress}`, diffSharePrice, diffTimestamp, vault, event.block)
      }
      vault.lastShareTimestamp = sharePrice.timestamp
      vault.lastSharePrice = sharePrice.newSharePrice
      vault.save()
    }

    const vaultHistoryId = `${event.transaction.hash.toHexString()}-${vaultAddress}`
    let vaultHistory = VaultHistory.load(vaultHistoryId)
    if (!vaultHistory) {
      vaultHistory = new VaultHistory(vaultHistoryId);
      vaultHistory.vault = vault.id;
      vaultHistory.sharePrice = vault.lastSharePrice;
      vaultHistory.sharePriceDec = vault.lastSharePrice.divDecimal(pow(BD_TEN, vault.decimal.toI32()))
      vaultHistory.priceUnderlying = vault.priceUnderlying;
      vaultHistory.timestamp = event.block.timestamp;
      vaultHistory.save();
    }

  }
}

export function handleBlock(block: ethereum.Block): void {
  const vaultUtils = getVaultUtils();
  for (let i = 0; i < vaultUtils.vaults.length; i++) {
    const vault = loadOrCreateVault(Address.fromString(vaultUtils.vaults[i]), block);
    const price = vault.priceUnderlying;

    const priceHistoryId = `${vault.id}-${block.number.toString()}`
    let priceHistory = PriceHistory.load(priceHistoryId)
    if (!priceHistory) {
      priceHistory = new PriceHistory(priceHistoryId);
      priceHistory.vault = vault.id
      priceHistory.price = price;
      priceHistory.createAtBlock = block.number
      priceHistory.timestamp = block.timestamp
      priceHistory.save();
    }
  }
}
