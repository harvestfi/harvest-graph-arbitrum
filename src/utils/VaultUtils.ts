import { Address, BigInt } from "@graphprotocol/graph-ts";
import { VaultContract } from "../../generated/templates/VaultListener/VaultContract";
import { NULL_ADDRESS } from "./Constant";
import { ERC20 } from "../../generated/Controller/ERC20";
import { VaultV2Contract } from "../../generated/Controller/VaultV2Contract";

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



export function fetchContractTotalAssets(address: Address): BigInt {
  const contract = VaultV2Contract.bind(address);
  let totalSupply = BigInt.fromI32(0)
  let tryTotalAssets = contract.try_totalAssets()
  if (!tryTotalAssets.reverted) {
    totalSupply = tryTotalAssets.value
  }
  return totalSupply
}