import { UniswapV3Pool, Vault } from "../../generated/schema";
import { Address } from "@graphprotocol/graph-ts";
import { NULL_ADDRESS, UNISWAP_V3_FEES } from "./Constant";

export function getUniswapPoolV3ByVault(vault: Vault): Address {

  const symbolArray = vault.symbol.split('_')

  if (symbolArray.length != 3) {
    return NULL_ADDRESS
  }

  const symbolA = symbolArray[1].toLowerCase()
  const symbolB = symbolArray[2].toLowerCase()
  for (let i=0;i<UNISWAP_V3_FEES.length;i++) {
    const result = findById(symbolA, symbolB, UNISWAP_V3_FEES[i])
    if (result != null) {
      return Address.fromString(result.pool)
    }
  }
  return NULL_ADDRESS
}

function findById(symbolA: string, symbolB: string, fee: string): UniswapV3Pool | null {
  return UniswapV3Pool.load(`${symbolA}-${symbolB}-${fee}`)
}