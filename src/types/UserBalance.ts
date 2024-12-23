import { Address, BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import {
  UserBalance,
  UserBalanceHistory,
  UserTransaction,
  Vault,
} from '../../generated/schema';
import { VaultContract } from "../../generated/templates/VaultListener/VaultContract";
import { ERC20 } from "../../generated/Controller/ERC20";
import { pow } from "../utils/MathUtils";
import { BD_TEN } from "../utils/Constant";

export function createUserBalance(vaultAddress: Address, amount: BigInt, beneficary: Address, isDeposit: boolean, tx: string, timestamp: BigInt = BigInt.zero(), block: BigInt = BigInt.zero()): UserBalance | null {
  const vault = Vault.load(vaultAddress.toHex())
  if (vault != null) {
    const vaultContract = VaultContract.bind(vaultAddress)
    let poolBalance = BigDecimal.zero()
    if (vault.pool != null) {
      const poolContract = ERC20.bind(Address.fromString(vault.pool!))
      poolBalance = poolContract.balanceOf(beneficary).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
    }
    const vaultBalance = vaultContract.balanceOf(beneficary).divDecimal(pow(BD_TEN, vault.decimal.toI32()))
    const value = vaultBalance.plus(poolBalance)

    const userBalanceId = `${vault.id}-${beneficary.toHex()}`
    let userBalance = UserBalance.load(userBalanceId)
    if (userBalance == null) {
      userBalance = new UserBalance(userBalanceId)
      userBalance.createAtBlock = block
      userBalance.timestamp = timestamp
      userBalance.vault = vault.id
      userBalance.value = BigDecimal.zero()
      userBalance.userAddress = beneficary.toHex()
      userBalance.underlyingBalance = BigDecimal.zero()
    }

    const delimiter = pow(BD_TEN, vault.decimal.toI32());
    const sharePriceFormatted = vault.lastSharePrice.divDecimal(delimiter);
    if (isDeposit) {
      userBalance.underlyingBalance = userBalance.underlyingBalance.plus(amount.divDecimal(delimiter).times(sharePriceFormatted))
    } else {
      userBalance.underlyingBalance = userBalance.underlyingBalance.minus(amount.divDecimal(delimiter).times(sharePriceFormatted))
    }

    let profit = BigDecimal.zero();
    if (userBalance.underlyingBalance.lt(BigDecimal.zero())) {
      profit = userBalance.underlyingBalance.neg().times(vault.priceUnderlying)
      userBalance.underlyingBalance = BigDecimal.zero()
    }

    userBalance.poolBalance = poolBalance
    userBalance.vaultBalance = vaultBalance
    userBalance.value = value

    userBalance.save()
    const historyId = Bytes.fromUTF8(`${tx}-${beneficary.toHex()}-${vault.id}-${isDeposit.toString()}`);
    const userBalanceHistory = new UserBalanceHistory(historyId)
    userBalanceHistory.createAtBlock = block
    userBalanceHistory.timestamp = timestamp
    userBalanceHistory.userAddress = beneficary.toHex()
    userBalanceHistory.vault = vault.id
    userBalanceHistory.underlyingBalance = userBalance.underlyingBalance
    userBalanceHistory.transactionType = isDeposit
      ? 'Deposit'
      : 'Withdraw'
    userBalanceHistory.value = userBalance.value
    userBalanceHistory.poolBalance = userBalance.poolBalance
    userBalanceHistory.vaultBalance = userBalance.vaultBalance
    userBalanceHistory.priceUnderlying = vault.priceUnderlying

    userBalanceHistory.sharePrice = vault.lastSharePrice;
    userBalanceHistory.save()

    const userTransaction = new UserTransaction(Bytes.fromUTF8(`${tx}-${vault.id}-${isDeposit.toString()}`))
    userTransaction.createAtBlock = block
    userTransaction.timestamp = timestamp
    userTransaction.userAddress = beneficary.toHex()
    userTransaction.vault = vault.id
    userTransaction.transactionType = isDeposit
      ? 'Deposit'
      : 'Withdraw'
    userTransaction.sharePrice = vault.lastSharePrice;
    userTransaction.value = amount
    userTransaction.save();

    return userBalance;
  }
  return null;
}