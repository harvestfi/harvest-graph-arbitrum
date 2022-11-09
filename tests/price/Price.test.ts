import { describe, test, assert } from "matchstick-as/assembly/index";
import { getPriceForUniswapV3 } from "../../src/utils/Price";
import { Vault } from "../../generated/schema";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

describe('Get price for uniswapV3', () => {
  test('Price by UniV3_WBTC_WETH', () => {
    const vault = new Vault('ID')
    vault.name = 'name'
    vault.symbol = 'symbol'
    vault.decimal = BigInt.fromI32(18)
    vault.createAtBlock = BigInt.fromI32(1115002)
    vault.timestamp = BigInt.fromI32(12412424)
    vault.underlying = '1'
    vault.lastShareTimestamp = BigInt.fromI32(0)
    const price = getPriceForUniswapV3(vault, 123)
    assert.assertTrue(price.equals(BigDecimal.zero()))
  })
})