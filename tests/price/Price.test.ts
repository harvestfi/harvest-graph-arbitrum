import { describe, test, assert, createMockedFunction } from "matchstick-as/assembly/index";
import {
  getPriceForBalancer, getPriceForCoin,
  getPriceForCurve, getPriceFotMeshSwap,
  getPriceLpUniPair,
} from '../../src/utils/PriceUtils';
import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BI_18,
  CAMELOT_ETH_FARM,
  isPsAddress,
  ORACLE_ADDRESS_MAINNET_FIRST,
  RADIANT_PRICE,
  SOLID_LIZARD_FACTORY,
  SUSHI_ETH_RADIANT,
  SUSHI_SWAP_FACTORY,
  USDC_ARBITRUM, WETH,
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

  test('Get price for balancer RDNT ETH', () => {

    const underlyingAddress = '0x32df62dc3aed2cd6224193052ce665dc18165841';
    const underlying = Address.fromString(underlyingAddress);
    const poolId = '0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd';
    const vaultAddress = '0xba12222222228d8ba445958a75a0704d566bf2c8';
    const vault = Address.fromString(vaultAddress);
    const tokenAAddress = '0x3082CC23568eA640225c2467653dB90e9250AaA0'
    const tokenBAddress = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    const tokenA = Address.fromString(tokenAAddress)
    const tokenB = Address.fromString(tokenBAddress);
    const tokenPriceA = BigInt.fromString('30942913');
    const tokenPriceB = BigInt.fromString('1800000000000000000000');
    const totalSupply = BigInt.fromString('28757796771623092704324149');

    const pool = Address.fromString('0x905dfCD5649217c42684f23958568e533C711Aa3');



    createMockedFunction(underlying, 'getPoolId', 'getPoolId():(bytes32)')
      .returns([ethereum.Value.fromBytes(Bytes.fromHexString(poolId))])


    createMockedFunction(underlying, 'totalSupply', 'totalSupply():(uint256)')
      .returns([ethereum.Value.fromSignedBigInt(totalSupply)]);

    createMockedFunction(underlying, 'getVault', 'getVault():(address)')
      .returns([ethereum.Value.fromAddress(vault)]);


    createMockedFunction(vault, 'getPoolTokens', 'getPoolTokens(bytes32):(address[],uint256[],uint256)')
      .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString(poolId))])
      .returns([
        ethereum.Value.fromAddressArray([tokenA, tokenB]),
        ethereum.Value.fromSignedBigIntArray(
          [
            BigInt.fromString('109365040232991172195472071'),
            BigInt.fromString('4627863755394999088131')]),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('17307159'))
      ]);

    createMockedFunction(RADIANT_PRICE, 'getTokenPriceUsd', 'getTokenPriceUsd():(uint256)')
      .returns([ethereum.Value.fromUnsignedBigInt(tokenPriceA)]);


    createMockedFunction(SUSHI_SWAP_FACTORY, "getPair", "getPair(address,address):(address)")
      .withArgs([
        ethereum.Value.fromAddress(USDC_ARBITRUM),
        ethereum.Value.fromAddress(tokenB)
      ])
      .returns([ethereum.Value.fromAddress(pool)])


    createMockedFunction(pool, "getReserves", "getReserves():(uint112,uint112,uint32)")
      .returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("2669883826634647517748")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("4864473684875")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1685182354")),
      ])

    createMockedFunction(tokenA, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromI32(18)]);
    createMockedFunction(tokenB, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromI32(18)]);

    createMockedFunction(SUSHI_ETH_RADIANT, "getReserves", "getReserves():(uint112,uint112,uint32)")
      .returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("179091336498817433914723")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("30103108473837771151")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1685202299"))
      ]);


    createMockedFunction(SUSHI_SWAP_FACTORY, "getPair", "getPair(address,address):(address)")
      .withArgs([
        ethereum.Value.fromAddress(USDC_ARBITRUM),
        ethereum.Value.fromAddress(WETH)
      ])
      .returns([ethereum.Value.fromAddress(Address.fromString("0x905dfCD5649217c42684f23958568e533C711Aa3"))])


    createMockedFunction(Address.fromString("0x905dfCD5649217c42684f23958568e533C711Aa3"), "getReserves", "getReserves():(uint112,uint112,uint32)")
      .returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("2690671547151467737009")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("4891154111720")),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1685205517"))
      ]);

    const price = getPriceForBalancer(underlyingAddress);

    log.log(log.Level.INFO, `price = ${price}`)
    assert.assertTrue(price.equals(BigDecimal.fromString('1.454544757503421599038481958830915')))
  })
})