import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { fetchContractDecimal, fetchContractName, fetchContractSymbol } from "../utils/ERC20Utils";
import { loadOrCreateERC20Token } from "./Token";
import { VaultListener } from "../../generated/templates";
import { loadOrCreateStrategy } from "./Strategy";
import { fetchUnderlyingAddress } from "../utils/VaultUtils";
import { Vault, VaultUtil } from '../../generated/schema';
import { BI_TEN } from '../utils/Constant';
import { powBI } from '../utils/MathUtils';

export function loadOrCreateVault(vaultVal: string, timestamp: BigInt, block: BigInt, strategyAddress: string = 'unknown'): Vault {
  let vault = Vault.load(vaultVal)
  if (vault == null) {
    const vaultAddress = Address.fromString(vaultVal);
    vault = new Vault(vaultVal);
    const decimal = fetchContractDecimal(vaultAddress);
    vault.name = fetchContractName(vaultAddress)
    vault.decimal = decimal;
    vault.symbol = fetchContractSymbol(vaultAddress)
    const underlying = fetchUnderlyingAddress(vaultAddress)
    vault.createAtBlock = block;
    if (strategyAddress != 'unknown' && strategyAddress != null) {
      loadOrCreateStrategy(strategyAddress, timestamp, block, vaultVal)
    }
    vault.strategy = strategyAddress
    vault.active = true;
    vault.timestamp = timestamp;
    vault.underlying = loadOrCreateERC20Token(underlying).id
    vault.lastShareTimestamp = BigInt.zero()
    vault.lastSharePrice = powBI(BI_TEN, decimal.toI32());
    vault.skipFirstApyReward = true
    vault.tvl = BigDecimal.zero()
    vault.priceUnderlying = BigDecimal.zero();
    vault.apyReward = BigDecimal.zero();
    vault.apy = BigDecimal.zero();
    vault.lastPriceUpdate = BigInt.zero();
    vault.tvlSequenceId = 1;
    vault.priceFeedSequenceId = 0;
    vault.apyAutoCompound = BigDecimal.zero();
    vault.users = [];
    vault.lastTimestampProcess = BigInt.zero();
    vault.lastUsersShareTimestamp = BigInt.zero();
    vault.lastTotalSupply = BigInt.zero();
    vault.lastApr = BigDecimal.zero();
    vault.lastDiffTimestamp = BigDecimal.zero();
    vault.lastDiffSharePrice = BigDecimal.zero();
    vault.lastVaultSnapshotTs = BigInt.zero();
    vault.save();
    VaultListener.create(vaultAddress)
  }

  return vault;
}

export function getVaultUtils(): VaultUtil {
  const id = '1';
  let vaultUtils = VaultUtil.load(id)
  if (!vaultUtils) {
    vaultUtils = new VaultUtil(id);
    vaultUtils.vaults = [];
    vaultUtils.vaultLength = 0;
    vaultUtils.lastBlockPrice = BigInt.zero();
    vaultUtils.save()
  }
  return vaultUtils;
}