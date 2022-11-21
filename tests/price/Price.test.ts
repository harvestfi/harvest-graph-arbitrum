import { describe, test, assert, createMockedFunction } from "matchstick-as/assembly/index";
import { getPriceForBalancer, isLpUniPair, isUniswapV3 } from "../../src/utils/Price";
import { Vault } from "../../generated/schema";
import { Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { isPsAddress, ORACLE_ADDRESS_MAINNET_FIRST, ORACLE_ADDRESS_MATIC } from "../../src/utils/Constant";
import { WeightedPool2TokensContract } from "../../generated/templates/VaultListener/WeightedPool2TokensContract";

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

  test('Get price for balancer polybase', () => {
    const undelyingAddress = '0x0297e37f1873D2DAb4487Aa67cD56B58E2F27875'
    const balancer = Address.fromString(undelyingAddress)

    const vaultAddress = '0x0297e37f1873D2DAb4487Aa67cD56B58E2F27876'
    const vault = Address.fromString(vaultAddress)

    const tokenAddress1 = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    const token1 = Address.fromString(tokenAddress1)

    const tokenAddress2 = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    const token2 = Address.fromString(tokenAddress2)

    const tokenAddress3 = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
    const token3 = Address.fromString(tokenAddress3)

    const tokenAddress4 = '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3'
    const token4 = Address.fromString(tokenAddress4)

    createMockedFunction(balancer, 'getPoolId', 'getPoolId():(bytes32)')
      .returns([ethereum.Value.fromFixedBytes(Bytes.fromHexString('0x0297e37f1873d2dab4487aa67cd56b58e2f27875000100000000000000000002'))])
    createMockedFunction(balancer, 'totalSupply', 'totalSupply():(uint256)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('270238182103759292022844'))])
    createMockedFunction(balancer, 'getVault', 'getVault():(address)')
      .returns([ethereum.Value.fromAddress(vault)])

    createMockedFunction(vault, 'getPoolTokens', 'getPoolTokens(bytes32):(address[],uint256[],uint256)')
      .withArgs([ethereum.Value.fromFixedBytes(Bytes.fromHexString('0x0297e37f1873d2dab4487aa67cd56b58e2f27875000100000000000000000002'))])
      .returns([
        ethereum.Value.fromAddressArray(
          [token1, token2, token3, token4]
        ),
        ethereum.Value.fromUnsignedBigIntArray(
          [
            BigInt.fromString('818581286063562164127798'),
            BigInt.fromString('657575647370'),
            BigInt.fromString('586470343872098925109'),
            BigInt.fromString('125351513962837477294798'),

          ]
        ),
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('35879943'))
      ])

    createMockedFunction(ORACLE_ADDRESS_MAINNET_FIRST, 'getPrice', 'getPrice(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(token1)])
      .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString('797122480266327609'))])
    createMockedFunction(ORACLE_ADDRESS_MAINNET_FIRST, 'getPrice', 'getPrice(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(token2)])
      .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString('1000000000000000000'))])
    createMockedFunction(ORACLE_ADDRESS_MAINNET_FIRST, 'getPrice', 'getPrice(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(token3)])
      .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString('1115991959259826800576'))])
    createMockedFunction(ORACLE_ADDRESS_MAINNET_FIRST, 'getPrice', 'getPrice(address):(uint256)')
      .withArgs([ethereum.Value.fromAddress(token4)])
      .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString('5189429213577041816'))])

    createMockedFunction(token1, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18'))])
    createMockedFunction(token2, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('6'))])
    createMockedFunction(token3, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18'))])
    createMockedFunction(token4, 'decimals', 'decimals():(uint8)')
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString('18'))])



    const result = getPriceForBalancer(undelyingAddress, 16841618)

    assert.assertTrue(result.equals(BigDecimal.fromString('7.243641614364690646397906383662353')))
  })
})