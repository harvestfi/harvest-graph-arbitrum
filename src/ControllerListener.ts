import { PriceHistory, SharePrice, Strategy, Vault, VaultHistory } from '../generated/schema';
import { loadOrCreateVault } from './types/Vault';
import { pow, powBI } from "./utils/MathUtils";
import {
  BD_TEN,
} from './utils/Constant';
import { SharePriceChangeLog } from "../generated/Controller/ControllerContract";
import { Bytes } from '@graphprotocol/graph-ts';
import { calculateAndSaveApyAutoCompound } from "./types/Apy";


export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault.toHex();
  const strategyAddress = event.params.strategy.toHex();
  const block = event.block.number;
  const timestamp = event.block.timestamp;
  const sharePrice = new SharePrice(Bytes.fromUTF8(`${event.transaction.hash.toHex()}-${vaultAddress}`));
  const vault = loadOrCreateVault(vaultAddress, timestamp, block, strategyAddress)

  // share prices
  sharePrice.vault = vaultAddress;
  sharePrice.strategy = strategyAddress;
  sharePrice.oldSharePrice = event.params.oldSharePrice;
  sharePrice.newSharePrice = event.params.newSharePrice;
  sharePrice.createAtBlock = block;
  sharePrice.timestamp = timestamp;
  sharePrice.save();

  const lastSharePrice = vault.lastSharePrice
  if (!vault.lastShareTimestamp.isZero()) {
    const lastShareTimestamp = vault.lastShareTimestamp
    const diffSharePrice = sharePrice.newSharePrice.minus(lastSharePrice).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
    const diffTimestamp = timestamp.minus(lastShareTimestamp)
    calculateAndSaveApyAutoCompound(Bytes.fromUTF8(`${event.transaction.hash.toHex()}-${vaultAddress}`), diffSharePrice, diffTimestamp, vault, event.block.timestamp, event.block.number)
  }
  vault.lastSharePrice = sharePrice.newSharePrice
  vault.lastShareTimestamp = sharePrice.timestamp
  vault.save()

  const vaultHistoryId = Bytes.fromUTF8(`${event.transaction.hash.toHexString()}-${vaultAddress}`)
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