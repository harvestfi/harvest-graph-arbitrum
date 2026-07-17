import { MarketBalancesUpdated, PlasmaVaultContract } from '../generated/PlasmaVault/PlasmaVaultContract';
import { PlasmaUserBalance, PlasmaUserBalanceHistory, PlasmaVault, PlasmaVaultHistory, UserTransaction } from '../generated/schema';
import { Transfer } from '../generated/Controller/ERC20';
import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { FuseContract } from '../generated/PlasmaVault/FuseContract';
import { loadOrCreateVault } from './types/Vault';
import { getPriceForCoin } from './utils/PriceUtils';
import { BD_18, BD_ONE_HUNDRED, BD_TEN, BD_ZERO } from './utils/Constant';
import { bdToBI, pow } from './utils/MathUtils';
import { stringIdToBytes } from './utils/IdUtils';
import { ERC20 } from '../generated/PlasmaVault/ERC20';

export function handleTransfer(event: Transfer): void {
  const vaultContract = PlasmaVaultContract.bind(event.address);
  let vault = PlasmaVault.load(event.address.toHexString());
  if (vault == null) {
    vault = new PlasmaVault(event.address.toHexString());
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    vault.decimals = vaultContract.decimals();
    vault.historySequenceId = BigInt.fromI32(0);
    vault.tvl = BigDecimal.zero();
    vault.apy = BigDecimal.zero();
    vault.assetOld = BigDecimal.zero();
    vault.assetNew = BigDecimal.zero();
    vault.lastSharePrice = BigInt.zero();
    vault.allocDatas = [];
    vault.newAllocDatas = [];
    vault.timestamp = event.block.timestamp;
    vault.priceUnderlying = BigDecimal.zero();
    vault.createAtBlock = event.block.number;
  }
  if (event.params.from != Address.zero()) {
    createUserBalance(vault, event.params.from, event.params.value, event.block.timestamp, event.transaction.hash.toHex(), event.block.number, false, event.transaction.from.toHexString());
  }
  if (event.params.to != Address.zero()) {
    createUserBalance(vault, event.params.to, event.params.value, event.block.timestamp, event.transaction.hash.toHex(), event.block.number, true, event.transaction.from.toHexString());
  }

  const fuses = vaultContract.getInstantWithdrawalFuses();
  let underlyingDecimal = 18;
  for (let i = 0; i < fuses.length; i++) {
    const fuseContract = FuseContract.bind(fuses[i]);
    const marketId = fuseContract.MARKET_ID();
    // TODO change logic
    const pVaultTemp = vaultContract.getInstantWithdrawalFusesParams(fuses[i], BigInt.fromI32(i))[1].toHexString().slice(26)
    const pVault = '0x' + pVaultTemp
    const hVault = loadOrCreateVault(pVault, event.block.timestamp, event.block.number);
    if (hVault != null) {
      underlyingDecimal = hVault.decimal.toI32();
      break;
    }
  }
  const price = getPriceForCoin(Address.fromString(vault.id)).divDecimal(BD_18);

  vault.tvl = vaultContract.totalAssets().divDecimal(pow(BD_TEN, underlyingDecimal)).times(price);

  const vaultHistory = new PlasmaVaultHistory(stringIdToBytes(`transfer-${event.transaction.hash.toHex()}-${event.address.toHexString()}`));
  vaultHistory.tvl = vault.tvl;
  vaultHistory.apy = vault.apy;
  vaultHistory.plasmaVault = vault.id;
  vaultHistory.historySequenceId = vault.historySequenceId;
  vaultHistory.priceUnderlying = getPriceForCoin(Address.fromString(vault.id)).divDecimal(BD_18);
  vaultHistory.sharePrice = bdToBI(
    vaultContract.totalAssets().
    divDecimal(pow(BD_TEN, underlyingDecimal))
      .div(vaultContract.totalSupply().divDecimal(pow(BD_TEN, vault.decimals)))
      .times(pow(BD_TEN, underlyingDecimal))
  );
  vaultHistory.assetOld = vault.assetOld;
  vaultHistory.assetNew = vault.assetNew;
  vaultHistory.allocDatas = vault.allocDatas;
  vaultHistory.newAllocDatas = vault.newAllocDatas;
  vaultHistory.timestamp = event.block.timestamp;
  vaultHistory.createAtBlock = event.block.number;
  vaultHistory.save();

  vault.priceUnderlying = vaultHistory.priceUnderlying;
  vault.lastSharePrice = vaultHistory.sharePrice;
  vault.save();
}

export function handleMarketBalancesUpdated(event: MarketBalancesUpdated): void {
  const vaultContract = PlasmaVaultContract.bind(event.address);
  let vault = PlasmaVault.load(event.address.toHexString());
  if (vault == null) {
    vault = new PlasmaVault(event.address.toHexString());
    vault.name = vaultContract.name();
    vault.symbol = vaultContract.symbol();
    vault.decimals = vaultContract.decimals();
    vault.historySequenceId = BigInt.fromI32(0);
    vault.tvl = BigDecimal.zero();
    vault.apy = BigDecimal.zero();
    vault.assetOld = BigDecimal.zero();
    vault.assetNew = BigDecimal.zero();
    vault.lastSharePrice = BigInt.zero();
    vault.allocDatas = [];
    vault.newAllocDatas = [];
    vault.timestamp = event.block.timestamp;
    vault.createAtBlock = event.block.number;
    vault.priceUnderlying = BigDecimal.zero();
    vault.save();
  }

  let assetOld = BigDecimal.zero();
  let assetNew = BigDecimal.zero();
  const allocDatas: BigDecimal[] = [];
  const newAllocDatas: BigDecimal[] = [];

  const fuses = vaultContract.getInstantWithdrawalFuses();
  let underlyingDecimal = 18;
  for (let i = 0; i < fuses.length; i++) {
    const fuseContract = FuseContract.bind(fuses[i]);
    const marketId = fuseContract.MARKET_ID();
    // TODO change logic
    const pVaultTemp = vaultContract.getInstantWithdrawalFusesParams(fuses[i], BigInt.fromI32(i))[1].toHexString().slice(26)

    // let pVaultHH = '';
    // for (let j = 0; j < pVaultTemp.length; j++) {
    //   if (pVaultTemp.charAt(j) !== '0') {
    //     pVaultHH = pVaultTemp.slice(j);
    //     break;
    //   }
    // }
    const pVault = '0x' + pVaultTemp

    log.log(log.Level.INFO, `Fetch vault ${pVault}`);
    log.log(log.Level.INFO, `Market id ${marketId.toString()}`);

    const hVault = loadOrCreateVault(pVault, event.block.timestamp, event.block.number);

    if (hVault != null) {
      log.log(log.Level.INFO, `Vault ${pVault} found, market id ${marketId.toString()}`);
      const marketInAssetOnchain = vaultContract.totalAssetsInMarket(marketId).toBigDecimal();
      const marketInAsset = marketInAssetOnchain.div(pow(BD_TEN, vault.decimals));
      assetOld = assetOld.plus(marketInAsset);
      const tempAssetNew = marketInAsset.times(BD_ONE_HUNDRED.plus(hVault.apy));
      log.log(log.Level.INFO, `asset ${tempAssetNew.toString()}, apy ${hVault.apy.toString()}`);
      if (tempAssetNew.gt(BD_ZERO)) {
        assetNew = assetNew.plus(tempAssetNew.div(BD_ONE_HUNDRED));
      }
      allocDatas.push(marketInAsset);
      underlyingDecimal = hVault.decimal.toI32();
    } else {
      log.log(log.Level.WARNING, `Can not find vault ${pVault}`);
    }
  }

  for (let i = 0; i < allocDatas.length; i++) {
    if (allocDatas[i].gt(BD_ZERO) && assetOld.gt(BD_ZERO)) {
      newAllocDatas.push(allocDatas[i].div(assetOld).times(BD_ONE_HUNDRED));
    } else {
      newAllocDatas.push(BD_ZERO);
    }
  }

  let apy = BigDecimal.zero();
  if (assetOld.gt(BD_ZERO)) {
    apy = assetNew.minus(assetOld).div(assetOld).times(BD_ONE_HUNDRED);
  }

  vault.historySequenceId = vault.historySequenceId.plus(BigInt.fromI32(1));
  vault.assetOld = assetOld;
  vault.assetNew = assetNew;
  vault.apy = apy;
  vault.allocDatas = allocDatas;
  vault.newAllocDatas = newAllocDatas;

  const vaultHistory = new PlasmaVaultHistory(stringIdToBytes(`${event.transaction.hash.toHex()}-${event.address.toHexString()}`));
  vaultHistory.tvl = vault.tvl;
  vaultHistory.apy = vault.apy;
  vaultHistory.plasmaVault = vault.id;
  vaultHistory.historySequenceId = vault.historySequenceId;
  vaultHistory.priceUnderlying = getPriceForCoin(Address.fromString(vault.id)).divDecimal(BD_18);
  vaultHistory.sharePrice = bdToBI(
    vaultContract.totalAssets().
    divDecimal(pow(BD_TEN, underlyingDecimal))
      .div(vaultContract.totalSupply().divDecimal(pow(BD_TEN, vault.decimals)))
      .times(pow(BD_TEN, underlyingDecimal))
  );
  vaultHistory.assetOld = vault.assetOld;
  vaultHistory.assetNew = vault.assetNew;
  vaultHistory.allocDatas = vault.allocDatas;
  vaultHistory.newAllocDatas = vault.newAllocDatas;
  vaultHistory.timestamp = event.block.timestamp;
  vaultHistory.createAtBlock = event.block.number;
  vaultHistory.save();

  vault.priceUnderlying = vaultHistory.priceUnderlying;
  vault.lastSharePrice = vaultHistory.sharePrice;
  vault.save();
}

function createUserBalance(plasmaVault: PlasmaVault, user: Address, amount: BigInt, timestamp: BigInt, tx: string, block: BigInt, isDeposit: boolean, txOrigin: string): void {
  let userBalance = PlasmaUserBalance.load(stringIdToBytes(plasmaVault.id + '-' + user.toHexString()));
  if (userBalance == null) {
    userBalance = new PlasmaUserBalance(stringIdToBytes(plasmaVault.id + '-' + user.toHexString()));
    userBalance.userAddress = user.toHexString();
    userBalance.plasmaVault = plasmaVault.id;
    userBalance.value = BigDecimal.zero();
    userBalance.timestamp = timestamp;
  }

  userBalance.value = ERC20.bind(Address.fromString(plasmaVault.id)).balanceOf(user).toBigDecimal();
  userBalance.save();

  const userBalanceHistory = new PlasmaUserBalanceHistory(stringIdToBytes(`${plasmaVault.id}-${user.toHexString()}-${timestamp.toString()}-${amount.toString()}`));
  userBalanceHistory.userAddress = user.toHexString();
  userBalanceHistory.value = userBalance.value;
  userBalanceHistory.plasmaVault = plasmaVault.id;
  userBalanceHistory.timestamp = timestamp;
  userBalanceHistory.tx = tx;
  userBalanceHistory.save();

  const userTransaction = new UserTransaction(Bytes.fromUTF8(`${tx}-${plasmaVault.id}-${isDeposit.toString()}`))
  userTransaction.createAtBlock = block
  userTransaction.timestamp = timestamp
  userTransaction.userAddress = user.toHexString();
  userTransaction.plasmaVault = plasmaVault.id
  userTransaction.transactionType = isDeposit
    ? 'Deposit'
    : 'Withdraw'
  userTransaction.sharePrice = plasmaVault.lastSharePrice;
  userTransaction.value = amount
  userTransaction.tx = tx;
  userTransaction.txOrigin = txOrigin;
  userTransaction.price = plasmaVault.priceUnderlying;
  userTransaction.save();
}