import { describe, test, assert, createMockedFunction } from "matchstick-as/assembly/index";
import {
  getPriceForBalancer, getPriceForCoin,
  getPriceForCurve, getPriceFotMeshSwap,
  getPriceLpUniPair,
} from '../../src/utils/PriceUtils';
import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BI_18, CAMELOT_ETH_FARM,
  isPsAddress,
  ORACLE_ADDRESS_MAINNET_FIRST, SOLID_LIZARD_FACTORY, SUSHI_SWAP_FACTORY,
} from '../../src/utils/Constant';
import { isLpUniPair, isMeshSwap, isUniswapV3 } from '../../src/utils/PlatformUtils';

describe('Get price for uniswapV3', () => {

  test('It is uniswapV3', () => {
    const result = isUniswapV3('fUniV3_USDC_WETH')
    assert.assertTrue(result)
  })

  test('It is PS address', () => {
    const result = isPsAddress('0x59258F4e15A5fC74A7284055A8094F58108dbD4f'.toLowerCase())
    assert.assertTrue(result)
  })

  test('It is lp', () => {
    const result = isLpUniPair('Uniswap V2')
    assert.assertTrue(result)
  })

  test('It is meshswap', () => {
    const result = isMeshSwap('Meshswap LP USDT-oUSDT')
    assert.assertTrue(result)
  })

  test('Get price for iFarm', () => {
    const camelotSwap = CAMELOT_ETH_FARM
    const token0 = Address.fromString('0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270')
    const token1 = Address.fromString('0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6')

    createMockedFunction(camelotSwap, 'getReserves', 'getReserves():(uint112,uint112,uint16,uint16)')
      .returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('26990535753519829458')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1300457263436280126139')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300')),
      ])


    createMockedFunction(SUSHI_SWAP_FACTORY, 'getPair', 'getPair(address,address):(address)')
      .withArgs([
        ethereum.Value.fromAddress(Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8')),
        ethereum.Value.fromAddress(Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1')),
      ])
      .returns([ethereum.Value.fromAddress(token0)])

    createMockedFunction(token0, 'getReserves', 'getReserves():(uint112,uint112,uint32)')
      .returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('3978557403619059998618')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('7459470764060')),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300')),
      ])



    createMockedFunction(Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'), 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18'))])


    const result = getPriceForCoin(Address.fromString('0x9dca587dc65ac0a043828b0acd946d71eb8d46c1'))
    log.log(log.Level.INFO, `result = ${result}`)

    assert.assertTrue(result.equals(BigInt.fromString('39060801479589884141')))
  })
})