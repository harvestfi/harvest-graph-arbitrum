import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { VaultContract } from "../../generated/templates/VaultListener/VaultContract";
import { NULL_ADDRESS } from "./Constant";
import { Vault } from "../../generated/schema";
import { fetchContractDecimal, fetchContractName, fetchContractSymbol } from "./ERC20";
import { loadOrCreateERC20Token } from "./Token";
import { VaultListener } from "../../generated/templates";


export function fetchUnderlyingAddress(address: Address): Address {
  const vault = VaultContract.bind(address)
  const tryUnderlying = vault.try_underlying();
  if (tryUnderlying.reverted) {
    return NULL_ADDRESS
  }

  return tryUnderlying.value
}

export function fetchPricePerFullShare(address: Address): BigInt {
  const vault = VaultContract.bind(address)
  const tryGetPricePerFullShare = vault.try_getPricePerFullShare()
  if (tryGetPricePerFullShare.reverted) {
    return BigInt.fromI32(10 ** vault.decimals())
  }
  const sharePrice: BigInt = tryGetPricePerFullShare.value
  // in some cases ppfs == 0
  if (sharePrice.le(BigInt.zero())) {
    return BigInt.fromI32(10 ** vault.decimals())
  }
  return sharePrice
}

export function loadOrCreateVault(vaultAddress: Address, block: ethereum.Block, strategy: string = 'unknown'): Vault {
  let vault = Vault.load(vaultAddress.toHex())
  if (vault == null) {
    vault = new Vault(vaultAddress.toHex());
    vault.name = fetchContractName(vaultAddress)
    vault.decimal = fetchContractDecimal(vaultAddress)
    vault.symbol = fetchContractSymbol(vaultAddress)
    const underlying = fetchUnderlyingAddress(vaultAddress)
    vault.createAtBlock = block.number;
    vault.strategy = strategy
    vault.active = true;
    vault.timestamp = block.timestamp;
    vault.underlying = loadOrCreateERC20Token(underlying).id
    vault.save();
    VaultListener.create(vaultAddress)
  }

  return vault;
}