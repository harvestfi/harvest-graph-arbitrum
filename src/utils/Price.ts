import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { OracleContract } from "../../generated/templates/VaultListener/OracleContract";
import {
  BALANCER_CONTRACT_NAME,
  BD_18,
  BD_ONE, BD_TEN, CURVE_CONTRACT_NAME,
  D_18,
  DEFAULT_PRICE, F_UNI_V3_CONTRACT_NAME, FARM_TOKEN, LP_UNI_PAIR_CONTRACT_NAME, NULL_ADDRESS,
  ORACLE_ADDRESS_FIRST,
  ORACLE_ADDRESS_SECOND, PS_ADDRESSES,
  STABLE_COIN_ARRAY, UNISWAP_V3_VALUE,
} from "./Constant";
import { Token, Vault } from "../../generated/schema";
import { UniswapV2PairContract } from "../../generated/ExclusiveRewardPoolListener/UniswapV2PairContract";
import { WeightedPool2TokensContract } from "../../generated/templates/VaultListener/WeightedPool2TokensContract";
import { BalancerVaultContract } from "../../generated/templates/VaultListener/BalancerVaultContract";
import { ERC20 } from "../../generated/Controller/ERC20";
import { CurveVaultContract } from "../../generated/templates/VaultListener/CurveVaultContract";
import { CurveMinterContract } from "../../generated/templates/VaultListener/CurveMinterContract";
import { getUniswapV3ByVault } from "./UniswapV3Pool";
import { UniswapV3PoolContract } from "../../generated/ExclusiveRewardPoolListener/UniswapV3PoolContract";
import { fetchContractDecimal } from "./ERC20";


export function getPriceForCoin(address: Address, block: number): BigInt {
  if (STABLE_COIN_ARRAY.join(' ').includes(address.toHex())) {
    return D_18
  }
  if (block >= 12015724) {
    let oracle = OracleContract.bind(ORACLE_ADDRESS_FIRST)
    if (block > 12820106) {
      oracle = OracleContract.bind(ORACLE_ADDRESS_SECOND)
    }

    let tryGetPrice = oracle.try_getPrice(address)
    if (tryGetPrice.reverted) {
      log.log(log.Level.ERROR, `Can not get price on block ${block} for address ${address.toHex()}`)
      return DEFAULT_PRICE
    }
    return tryGetPrice.value;
  }
  return DEFAULT_PRICE
}

export function getPriceByVault(vault: Vault, block: number): BigDecimal {

  if (isPsAddress(vault.id)) {
    return getPriceForCoin(FARM_TOKEN, block).divDecimal(BD_18)
  }

  // is from uniSwapV3 pools
  if (isUniswapV3(vault.name)) {
    return getPriceForUniswapV3(vault, block)
  }

  const underlyingAddress = vault.underlying
  const underlying = Token.load(underlyingAddress)
  if (underlying != null) {
    if (isLpUniPair(underlying.name)) {
      const tempPrice = getPriceForCoin(Address.fromString(underlyingAddress), block)
      if (tempPrice.gt(DEFAULT_PRICE)) {
        return tempPrice.divDecimal(BD_18)
      }
      return getPriceLpUniPair(underlying.id, block)
    }

    if (isBalancer(underlying.name)) {
      return getPriceForBalancer(underlying.id, block)
    }

    if (isCurve(underlying.name)) {
      const tempPrice = getPriceForCoin(Address.fromString(underlying.id), block)
      if (!tempPrice.isZero()) {
        return tempPrice.divDecimal(BD_18)
      }

      return getPriceForCurve(underlyingAddress, block)
    }
  }

  return getPriceForCoin(Address.fromString(underlyingAddress), block).divDecimal(BD_18)
}

function getPriceForUniswapV3(vault: Vault, block: number): BigDecimal {
  const poolAddress = getUniswapV3ByVault(vault)
  if (!poolAddress.equals(NULL_ADDRESS)) {
    const pool =  UniswapV3PoolContract.bind(poolAddress)
    const sqrtPriceX96 = pool.slot0().getSqrtPriceX96()
    const sqrt = sqrtPriceX96.toBigDecimal().truncate(2)
    const tokenA = pool.token0()
    const tokenB = pool.token1()
    const decimalA = fetchContractDecimal(tokenA)
    const decimalB = fetchContractDecimal(tokenB)

    const decimal = BD_TEN.truncate(decimalA.toI32()).div(BD_TEN.truncate(decimalB.toI32()))
    const price = sqrt.times(decimal.div(UNISWAP_V3_VALUE))
    const tokenBPrice = getPriceForCoin(tokenB, block).divDecimal(BD_18)
    return price.times(tokenBPrice)
  }
  return BigDecimal.zero()
}

function getPriceForCurve(underlyingAddress: string, block: number): BigDecimal {
  const curveContract = CurveVaultContract.bind(Address.fromString(underlyingAddress))
  const tryMinter = curveContract.try_minter()
  if (tryMinter.reverted) {
    return BigDecimal.zero()
  }
  const minter = CurveMinterContract.bind(tryMinter.value)
  let index = 0
  let tryCoins = minter.try_coins(BigInt.fromI32(index))
  while (tryCoins.reverted) {
    index = index + 1
    tryCoins = minter.try_coins(BigInt.fromI32(index))
  }
  const size = index + 1
  if (size < 1) {
    return BigDecimal.zero()
  }

  let value = BigDecimal.zero()

  for (let i=0;i<size;i++) {
    const index = BigInt.fromI32(i)
    const token = minter.coins(index)
    const tokenPrice = getPriceForCoin(token, block).divDecimal(BD_18)
    const balance = minter.balances(index)
    const decimals = ERC20.bind(token).decimals()
    value = value.plus(tokenPrice.times(normalizePrecision(balance, BigInt.fromI32(decimals)).toBigDecimal().div(BD_18)))
  }

  return value.times(BD_18).div(normalizePrecision(curveContract.totalSupply(), curveContract.decimals()).toBigDecimal())
}

// amount / (10 ^ 18 / 10 ^ decimal)
function normalizePrecision(amount: BigInt, decimal: BigInt): BigInt {
  return amount.div(D_18.div(BigInt.fromI64(10 ** decimal.toI64())))
}

function getPriceLpUniPair(underlyingAddress: string, block: number): BigDecimal {
  const uniswapV2Pair = UniswapV2PairContract.bind(Address.fromString(underlyingAddress))
  const reserves = uniswapV2Pair.getReserves()
  const totalSupply = uniswapV2Pair.totalSupply()
  const positionFraction = BD_ONE.div(totalSupply.toBigDecimal())
  const firstCoin = reserves.get_reserve0().toBigDecimal().times(positionFraction)
  const secondCoin = reserves.get_reserve1().toBigDecimal().times(positionFraction)


  const token0Price = getPriceForCoin(uniswapV2Pair.token0(), block)
  const token1Price = getPriceForCoin(uniswapV2Pair.token1(), block)

  if (token0Price.isZero() || token1Price.isZero()) {
    return BigDecimal.zero()
  }

  return token0Price
    .divDecimal(BD_18)
    .times(firstCoin)
    .plus(
      token1Price
        .divDecimal(BD_18)
        .times(secondCoin)
    )
    .times(BD_18)
}

function getPriceForBalancer(underlying: string, block: number): BigDecimal {
  const balancer = WeightedPool2TokensContract.bind(Address.fromString(underlying))
  const poolId = balancer.getPoolId()
  const totalSupply = balancer.totalSupply()
  const vault = BalancerVaultContract.bind(balancer.getVault())
  const tokenInfo = vault.getPoolTokens(poolId)

  // TODO calc in BD
  let price = BigDecimal.zero()
  for (let i=0;i<tokenInfo.getTokens().length;i++) {
    const tokenPrice = getPriceForCoin(tokenInfo.getTokens()[i], block).divDecimal(BD_18)
    price = price.plus(price.times(tokenPrice))
  }

  if (price.le(BigDecimal.zero())) {
    return price
  }
  return price.div(totalSupply.toBigDecimal())
}

function isPsAddress(address: string): boolean {
  if (PS_ADDRESSES.join(' ').includes(address)) {
    return true
  }

  return false
}

function isLpUniPair(name: string): boolean {
  if (LP_UNI_PAIR_CONTRACT_NAME.join(' ').includes(name.toLowerCase())) {
    return true
  }

  return false
}

function isBalancer(name: string): boolean {
  if (BALANCER_CONTRACT_NAME.startsWith(name.toLowerCase())) {
    return true
  }

  return false
}

function isCurve(name: string): boolean {
  if (CURVE_CONTRACT_NAME.startsWith(name.toLowerCase())) {
    return true
  }

  return false
}

function isUniswapV3(name: string): boolean {
  if (F_UNI_V3_CONTRACT_NAME.startsWith(name.toLowerCase())) {
    return true
  }
  return false
}