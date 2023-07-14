import { SharePrice, Strategy, Vault } from "../generated/schema";
import { loadOrCreateVault } from "./types/Vault";
import { pow, powBI } from "./utils/MathUtils";
import {
  BD_TEN,
  BI_EVERY_24_HOURS, BI_EVERY_7_DAYS,
  BI_TEN,
  EVERY_24_HOURS,
  EVERY_7_DAYS,
  MODULE_RESULT,
  MODULE_RESULT_V2,
} from './utils/Constant';
import { SharePriceChangeLog } from "../generated/Controller/ControllerContract";
import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts';
import { calculateAndSaveApyAutoCompound } from "./types/Apy";
import { createTotalTvl, getTvlUtils } from './types/TotalTvlUtils';


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

  if (vault != null && sharePrice.oldSharePrice != sharePrice.newSharePrice) {
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
}

export function handleBlock(block: ethereum.Block): void {
  const tvlUtils = getTvlUtils(block)
  if (block.timestamp.toI32() % EVERY_7_DAYS == MODULE_RESULT_V2) {
    createTotalTvl(block)
  } else if (block.timestamp.ge(tvlUtils.lastTimestampUpdate.plus(BI_EVERY_7_DAYS))) {
    createTotalTvl(block)
  }
}
