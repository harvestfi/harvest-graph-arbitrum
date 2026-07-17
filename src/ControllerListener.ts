import { ApyAutoCompound, GeneralApy, PriceHistory, SharePrice, Strategy, Tvl, Vault, VaultHistory } from '../generated/schema';
import { getVaultUtils, loadOrCreateVault } from './types/Vault';
import { pow, powBI } from "./utils/MathUtils";
import {
  BD_TEN,
  BI_EVERY_24_HOURS,
} from './utils/Constant';
import { SharePriceChangeLog } from "../generated/Controller/ControllerContract";
import { BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { calculateAndSaveApyAutoCompound } from "./types/Apy";
import { createTvl } from './types/Tvl';


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
    vault.lastDiffSharePrice = diffSharePrice
    vault.lastDiffTimestamp = diffTimestamp.toBigDecimal()
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
  createTvl(event.params.vault, event.block.timestamp, event.block.number)
}

export function handleBlock(block: ethereum.Block): void {
  const vaultUtils = getVaultUtils();
  for (let i = 0; i < vaultUtils.vaults.length; i++) {
    const vault = loadOrCreateVault(vaultUtils.vaults[i], block.timestamp, block.number);


    if (vault.lastVaultSnapshotTs && (vault.lastVaultSnapshotTs!.equals(BigInt.zero()) || vault.lastVaultSnapshotTs!.plus(BI_EVERY_24_HOURS).lt(block.timestamp))) {
      const vaultHistoryId = Bytes.fromUTF8(`${block.number.toHex()}-${vault.id}`)
      let tvl = Tvl.load(vaultHistoryId)
      if (tvl == null) {
        tvl = new Tvl(vaultHistoryId)
        tvl.vault = vault.id
        tvl.totalSupply = (vault.lastTotalSupply ? vault.lastTotalSupply! : BigInt.zero())
        tvl.value = vault.tvl
        tvl.priceUnderlying = vault.priceUnderlying
        tvl.sharePrice = vault.lastSharePrice
        tvl.tvlSequenceId = vault.tvlSequenceId
        tvl.timestamp = block.timestamp
        tvl.createAtBlock = block.number
        tvl.sharePriceDivDecimal = BigDecimal.fromString(tvl.sharePrice.toString()).div(pow(BD_TEN, vault.decimal.toI32()))
        tvl.decimal = pow(BD_TEN, vault.decimal.toI32())
        tvl.save()

        vault.tvlSequenceId = vault.tvlSequenceId + 1
      }

      let vaultHistory = VaultHistory.load(vaultHistoryId)
      if (vaultHistory == null) {
        vaultHistory = new VaultHistory(vaultHistoryId)
        vaultHistory.vault = vault.id
        vaultHistory.sharePrice = vault.lastSharePrice
        vaultHistory.sharePriceDec = vault.lastSharePrice.divDecimal(pow(BD_TEN, vault.decimal.toI32()))
        vaultHistory.priceUnderlying = vault.priceUnderlying
        vaultHistory.timestamp = block.timestamp
        vaultHistory.save()
      }

      let apyAutoCompound = ApyAutoCompound.load(vaultHistoryId)
      if (apyAutoCompound == null) {
        apyAutoCompound = new ApyAutoCompound(vaultHistoryId)
        apyAutoCompound.vault = vault.id
        apyAutoCompound.apy = vault.apyAutoCompound
        apyAutoCompound.apr = (vault.lastApr ? vault.lastApr! : BigDecimal.zero()) as BigDecimal
        apyAutoCompound.diffSharePrice = (vault.lastDiffSharePrice ? vault.lastDiffSharePrice! : BigDecimal.zero()) as BigDecimal
        apyAutoCompound.diffTimestamp = (vault.lastDiffTimestamp ? vault.lastDiffTimestamp! : BigDecimal.zero()) as BigDecimal
        apyAutoCompound.timestamp = block.timestamp
        apyAutoCompound.createAtBlock = block.number
        apyAutoCompound.save()
      }

      let generalApy = GeneralApy.load(vaultHistoryId)
      if (generalApy == null) {
        generalApy = new GeneralApy(vaultHistoryId)
        generalApy.vault = vault.id
        generalApy.apy = vault.apy
        generalApy.apyAutoCompound = vault.apyAutoCompound
        generalApy.apyReward = vault.apyReward
        generalApy.timestamp = block.timestamp
        generalApy.createAtBlock = block.number
        generalApy.save()
      }
      vault.lastVaultSnapshotTs = block.timestamp
      vault.save()
    }
  }
}