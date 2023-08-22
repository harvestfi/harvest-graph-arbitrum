import { Address, BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { OracleContract } from "../../generated/templates/VaultListener/OracleContract";
import {
  BALANCER_CONTRACT_NAME,
  BD_18,
  BD_ONE,
  BD_TEN, BD_ZERO,
  BI_18,
  BI_TEN, CAMELOT_ETH_FARM, CAMELOT_FACTORY,
  CURVE_CONTRACT_NAME,
  DEFAULT_DECIMAL, DEFAULT_IFARM_PRICE,
  DEFAULT_PRICE,
  F_UNI_V3_CONTRACT_NAME,
  getFarmToken,
  getOracleAddress, GRAIL, IFARM,
  isPsAddress,
  isStableCoin,
  LP_UNI_PAIR_CONTRACT_NAME,
  MESH_SWAP_CONTRACT,
  NULL_ADDRESS, RADIANT, RADIANT_PRICE, SILO,
  SOLID_LIZARD_FACTORY, SUSHI_ETH_RADIANT,
  SUSHI_SWAP_FACTORY,
  UNISWAP_V3_POISON_FINANCE_POOL,
  USD_PLUS,
  USDC_ARBITRUM,
  USDC_DECIMAL, WA_WETH, WBTC, WETH, X_GRAIL,
} from './Constant';
import { Token, Vault } from "../../generated/schema";
import { WeightedPool2TokensContract } from "../../generated/templates/VaultListener/WeightedPool2TokensContract";
import { BalancerVaultContract } from "../../generated/templates/VaultListener/BalancerVaultContract";
import { ERC20 } from "../../generated/Controller/ERC20";
import { CurveVaultContract } from "../../generated/templates/VaultListener/CurveVaultContract";
import { CurveMinterContract } from "../../generated/templates/VaultListener/CurveMinterContract";
import { fetchContractDecimal } from "./ERC20Utils";
import { pow, powBI } from "./MathUtils";
import {
  checkBalancer,
  isBalancer, isBtc,
  isCamelot,
  isCurve,
  isLpUniPair,
  isMeshSwap,
  isPoisonFinanceToken, isWeth,
} from './PlatformUtils';
import { UniswapV2PairContract } from "../../generated/Controller/UniswapV2PairContract";
import { MeshSwapContract } from "../../generated/Controller/MeshSwapContract";
import { UniswapV2FactoryContract } from "../../generated/Controller/UniswapV2FactoryContract";
import { UniswapV3PoolContract } from "../../generated/Controller/UniswapV3PoolContract";
import { CamelotPairContract } from '../../generated/Controller/CamelotPairContract';
import { LizardFactoryContract } from '../../generated/Controller/LizardFactoryContract';
import { LizardPairContract } from '../../generated/Controller/LizardPairContract';
import { CamelotFactoryContract } from '../../generated/Controller/CamelotFactoryContract';
import { createPriceFeed } from '../types/PriceFeed';


export function getPriceForCoin(address: Address): BigInt {
  if (address.equals(IFARM)) {
    const price = getPriceForIFARM();
    return price.isZero() ? DEFAULT_IFARM_PRICE : price;
  }
  if (address.equals(RADIANT)) {
    return getPriceForRadiant();
  }
  if (address.equals(X_GRAIL)) {
    return getPriceForCamelot(GRAIL);
  }
  if (isWeth(address)) {
    return getPriceForCoinWithSwap(WETH, USDC_ARBITRUM, SUSHI_SWAP_FACTORY)
  }
  if (address.equals(SILO)) {
    return getPriceForCamelot(address);
  }

  let price = getPriceForCoinWithSwap(address, USDC_ARBITRUM, SUSHI_SWAP_FACTORY)
  if (price.isZero()) {
    price = getPriceForCoinWithSwapLizard(address);
  }
  if (price.isZero()) {
    price = getPriceForCamelot(address);
  }
  return price;
}

function getPriceForCoinWithSwap(address: Address, stableCoin: Address, factory: Address): BigInt {
  if (isStableCoin(address.toHex())) {
    return BI_18
  }
  const uniswapFactoryContract = UniswapV2FactoryContract.bind(factory)
  const tryGetPair = uniswapFactoryContract.try_getPair(stableCoin, address)
  if (tryGetPair.reverted) {
    return DEFAULT_PRICE
  }

  const poolAddress = tryGetPair.value

  const uniswapPairContract = UniswapV2PairContract.bind(poolAddress);
  const tryGetReserves = uniswapPairContract.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for ${poolAddress.toHex()}`)

    return DEFAULT_PRICE
  }
  const reserves = tryGetReserves.value
  const decimal = fetchContractDecimal(address)

  const delimiter = powBI(BI_TEN, decimal.toI32() - USDC_DECIMAL + DEFAULT_DECIMAL)

  return reserves.get_reserve1().times(delimiter).div(reserves.get_reserve0())
}

function getPriceForCoinWithSwapLizard(address: Address): BigInt {
  if (isStableCoin(address.toHex())) {
    return BI_18
  }
  const uniswapFactoryContract = LizardFactoryContract.bind(SOLID_LIZARD_FACTORY)
  const tryGetPair = uniswapFactoryContract.try_getPair(USDC_ARBITRUM, address, false)
  if (tryGetPair.reverted) {
    return DEFAULT_PRICE
  }

  const poolAddress = tryGetPair.value

  const uniswapPairContract = LizardPairContract.bind(poolAddress);
  const tryGetReserves = uniswapPairContract.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for ${poolAddress.toHex()}`)

    return DEFAULT_PRICE
  }
  const reserves = tryGetReserves.value
  const decimal = fetchContractDecimal(address)

  const delimiter = powBI(BI_TEN, decimal.toI32() - USDC_DECIMAL + DEFAULT_DECIMAL)

  return reserves.get_reserve1().times(delimiter).div(reserves.get_reserve0())
}

function getPriceForCamelot(address: Address): BigInt {
  const camelotFactory = CamelotFactoryContract.bind(CAMELOT_FACTORY);
  const tryPair = camelotFactory.try_getPair(WETH, address);
  if (tryPair.reverted) {
    return BigInt.zero();
  }
  const pairAddress = tryPair.value;
  const camelotPairContract = CamelotPairContract.bind(pairAddress);
  const tryGetReserves = camelotPairContract.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for ${pairAddress.toHexString()} , for address: ${address.toHexString()}`)

    return DEFAULT_PRICE
  }
  const reserves = tryGetReserves.value
  if (reserves.get_reserve0().isZero()) {
    log.log(log.Level.WARNING, `get_reserve0 is 0 for ${pairAddress.toHexString()} , for address: ${address.toHexString()}`)
    return BigInt.zero();
  }
  let result = reserves.get_reserve1().divDecimal(reserves.get_reserve0().toBigDecimal())
  if (camelotPairContract.token1().equals(WETH)) {
    result = reserves.get_reserve0().divDecimal(reserves.get_reserve1().toBigDecimal())
  }
  if (result.equals(BD_ZERO)) {
    log.log(log.Level.WARNING, `Result is 0 for ${pairAddress.toHexString()} , for address: ${address.toHexString()}`)
    return BigInt.zero();
  }
  const ethPrice = getPriceForCoin(WETH)
  return toBigInt(ethPrice.divDecimal(BD_18).div(result).times(BD_18));
}

function getPriceForIFARM(): BigInt {
  const camelotPairContract = CamelotPairContract.bind(CAMELOT_ETH_FARM);
  const tryGetReserves = camelotPairContract.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for ${CAMELOT_ETH_FARM.toHex()}`)

    return DEFAULT_PRICE
  }
  const reserves = tryGetReserves.value
  const result = reserves.get_reserve1().div(reserves.get_reserve0())
  const ethPrice = getPriceForCoin(WETH)
  return ethPrice.div(result);
}

function getPriceForRadiant(): BigInt {
  const camelotPairContract = UniswapV2PairContract.bind(SUSHI_ETH_RADIANT);
  const tryGetReserves = camelotPairContract.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for ${SUSHI_ETH_RADIANT.toHex()}`)

    return DEFAULT_PRICE
  }
  const reserves = tryGetReserves.value
  const result = reserves.get_reserve1().divDecimal(reserves.get_reserve0().toBigDecimal())
  const ethPrice = getPriceForCoin(WETH)
  const price = ethPrice.divDecimal(BD_18).times(result);

  const val = price.times(BD_18).toString().split('.');
  if (val.length < 1) {
    return BigInt.zero();
  }
  return BigInt.fromString(val[0])
}

export function getPriceByVault(vault: Vault, block: ethereum.Block): BigDecimal {

  if (isPsAddress(vault.id)) {
    const tempPrice = getPriceForCoin(getFarmToken()).divDecimal(BD_18);
    createPriceFeed(vault, tempPrice, block);
    return tempPrice;
  }
  const underlyingAddress = vault.underlying

  let price = getPriceForCoin(Address.fromString(underlyingAddress))
  if (!price.isZero()) {
    createPriceFeed(vault, price.divDecimal(BD_18), block);
    return price.divDecimal(BD_18)
  }

  const underlying = Token.load(underlyingAddress)
  if (underlying != null) {
    if (isLpUniPair(underlying.name)) {
      const tempPrice = getPriceForCoin(Address.fromString(underlyingAddress))
      if (tempPrice.gt(DEFAULT_PRICE)) {
        createPriceFeed(vault, tempPrice.divDecimal(BD_18), block);
        return tempPrice.divDecimal(BD_18)
      }

      const tempInPrice = getPriceLpUniPair(underlying.id);
      createPriceFeed(vault, tempInPrice, block);
      return tempInPrice
    }

    if (isBtc(underlying.id)) {
      const tempPrice = getPriceForCoin(WBTC).divDecimal(BD_18);;
      createPriceFeed(vault, tempPrice, block);
      return tempPrice
    }

    if (isPoisonFinanceToken(underlying.name)) {
      const tempPrice = getPriceForUniswapV3(UNISWAP_V3_POISON_FINANCE_POOL);
      createPriceFeed(vault, tempPrice, block);
      return tempPrice;
    }
    if (isBalancer(underlying.name)) {
      const tempPrice = getPriceForBalancer(underlying.id);
      createPriceFeed(vault, tempPrice, block);
      return tempPrice
    }

    if (isCurve(underlying.name)) {
      const tempPrice = getPriceForCoin(Address.fromString(underlying.id))
      if (!tempPrice.isZero()) {
        createPriceFeed(vault, tempPrice.divDecimal(BD_18), block);
        return tempPrice.divDecimal(BD_18)
      }

      const tempInPrice = getPriceForCurve(underlyingAddress);
      createPriceFeed(vault, tempInPrice, block);
      return tempInPrice
    }

    if (isMeshSwap(underlying.name)) {
      const tempPrice = getPriceFotMeshSwap(underlyingAddress)
      createPriceFeed(vault, tempPrice, block);
      return tempPrice;
    }

    if (isCamelot(underlying.name)) {
      const tempPrice = getPriceCamelotUniPair(underlyingAddress);
      createPriceFeed(vault, tempPrice, block);
      return tempPrice;
    }
  }

  return BigDecimal.zero()

}

export function getPriceForCurve(underlyingAddress: string): BigDecimal {
  const curveContract = CurveVaultContract.bind(Address.fromString(underlyingAddress))
  const tryMinter = curveContract.try_minter()

  let minter = CurveMinterContract.bind(Address.fromString(underlyingAddress))
  if (!tryMinter.reverted) {
    minter = CurveMinterContract.bind(tryMinter.value)
  }

  let index = 0
  let tryCoins = minter.try_coins(BigInt.fromI32(index))
  while (!tryCoins.reverted) {
    const coin = tryCoins.value
    if (coin.equals(Address.zero())) {
      index = index - 1
      break
    }
    index = index + 1
    tryCoins = minter.try_coins(BigInt.fromI32(index))
  }
  const tryDecimals = curveContract.try_decimals()
  let decimal = DEFAULT_DECIMAL
  if (!tryDecimals.reverted) {
    decimal = tryDecimals.value.toI32()
  } else {
    log.log(log.Level.WARNING, `Can not get decimals for ${underlyingAddress}`)
  }
  const size = index + 1
  if (size < 1) {
    return BigDecimal.zero()
  }

  let value = BigDecimal.zero()

  for (let i=0;i<size;i++) {
    const index = BigInt.fromI32(i)
    const tryCoins1 = minter.try_coins(index)
    if (tryCoins1.reverted) {
      break
    }
    const token = tryCoins1.value
    let tokenPrice = getPriceForCoin(token).toBigDecimal()
    if (tokenPrice == BigDecimal.zero()) {
      tokenPrice = getPriceForCurve(token.toHex())
    } else {
      tokenPrice = tokenPrice.div(BD_18)
    }
    const balance = minter.balances(index)
    const tryDecimalsTemp = ERC20.bind(token).try_decimals()
    let decimalsTemp = DEFAULT_DECIMAL
    if (!tryDecimalsTemp.reverted) {
      decimalsTemp = tryDecimalsTemp.value
    } else {
      log.log(log.Level.WARNING, `Can not get decimals for ${token}`)
    }
    const tempBalance = balance.toBigDecimal().div(pow(BD_TEN, decimalsTemp))

    value = value.plus(tokenPrice.times(tempBalance))
  }
  return value.times(BD_18).div(curveContract.totalSupply().toBigDecimal())
}
// amount / (10 ^ 18 / 10 ^ decimal)
function normalizePrecision(amount: BigInt, decimal: BigInt): BigInt {
  return amount.div(BI_18.div(BigInt.fromI64(10 ** decimal.toI64())))
}

export function getPriceLpUniPair(underlyingAddress: string): BigDecimal {
  const uniswapV2Pair = UniswapV2PairContract.bind(Address.fromString(underlyingAddress))
  const tryGetReserves = uniswapV2Pair.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for underlyingAddress = ${underlyingAddress}, try get price for coin`)

    return getPriceForCoin(Address.fromString(underlyingAddress)).divDecimal(BD_18)
  }
  const reserves = tryGetReserves.value
  const totalSupply = uniswapV2Pair.totalSupply()
  const positionFraction = BD_ONE.div(totalSupply.toBigDecimal().div(BD_18))

  const token0 = uniswapV2Pair.token0()
  const token1 = uniswapV2Pair.token1()

  const firstCoin = reserves.get_reserve0().toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token0).toI32()))
  const secondCoin = reserves.get_reserve1().toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token1).toI32()))


  const token0Price = getPriceForCoin(token0)
  const token1Price = getPriceForCoin(token1)

  if (token0Price.isZero() || token1Price.isZero()) {
    log.log(log.Level.WARNING, `Some price is zero token0 ${token0.toHex()} = ${token0Price} , token1 ${token1.toHex()} = ${token1Price}`)
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
}

export function getPriceCamelotUniPair(underlyingAddress: string): BigDecimal {
  const uniswapV2Pair = CamelotPairContract.bind(Address.fromString(underlyingAddress))
  const tryGetReserves = uniswapV2Pair.try_getReserves()
  if (tryGetReserves.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for underlyingAddress = ${underlyingAddress}, try get price for coin`)

    return getPriceForCoin(Address.fromString(underlyingAddress)).divDecimal(BD_18)
  }
  const reserves = tryGetReserves.value
  const totalSupply = uniswapV2Pair.totalSupply()
  const positionFraction = BD_ONE.div(totalSupply.toBigDecimal().div(BD_18))

  const token0 = uniswapV2Pair.token0()
  const token1 = uniswapV2Pair.token1()

  const firstCoin = reserves.get_reserve0().toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token0).toI32()))
  const secondCoin = reserves.get_reserve1().toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token1).toI32()))


  const token0Price = getPriceForCoin(token0)
  const token1Price = getPriceForCoin(token1)

  if (token0Price.isZero() || token1Price.isZero()) {
    log.log(log.Level.WARNING, `Some price is zero token0 ${token0.toHex()} = ${token0Price} , token1 ${token1.toHex()} = ${token1Price}`)
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
}

export function getPriceForBalancer(underlying: string): BigDecimal {
  const balancer = WeightedPool2TokensContract.bind(Address.fromString(underlying))
  const poolId = balancer.getPoolId()
  const totalSupply = balancer.totalSupply()
  const vault = BalancerVaultContract.bind(balancer.getVault())
  const tokenInfo = vault.getPoolTokens(poolId)

  let price = BigDecimal.zero()
  for (let i=0;i<tokenInfo.getTokens().length;i++) {
    const tokenAddress = tokenInfo.getTokens()[i]
    const tryDecimals = ERC20.bind(tokenAddress).try_decimals()
    let decimal = DEFAULT_DECIMAL
    if (!tryDecimals.reverted) {
      decimal = tryDecimals.value
    }
    const balance = normalizePrecision(tokenInfo.getBalances()[i], BigInt.fromI32(decimal)).toBigDecimal()

    let tokenPrice = BD_ZERO;
    if (tokenAddress == Address.fromString(underlying)) {
      tokenPrice = BD_ONE;
    } else if (checkBalancer(tokenAddress)) {
      tokenPrice = getPriceForBalancer(tokenAddress.toHexString());
    } else {
      tokenPrice = getPriceForCoin(tokenAddress).divDecimal(BD_18)
    }

    price = price.plus(balance.times(tokenPrice))
  }

  if (price.le(BigDecimal.zero())) {
    return price
  }
  return price.div(totalSupply.toBigDecimal())
}


export function getPriceFotMeshSwap(underlyingAddress: string): BigDecimal {
  const meshSwap = MeshSwapContract.bind(Address.fromString(underlyingAddress))

  const tryReserve0 = meshSwap.try_reserve0()
  const tryReserve1 = meshSwap.try_reserve1()

  if (tryReserve0.reverted || tryReserve1.reverted) {
    log.log(log.Level.WARNING, `Can not get reserves for underlyingAddress = ${underlyingAddress}, try get price for coin`)

    return BigDecimal.zero()
  }

  const reserve0 = tryReserve0.value
  const reserve1 = tryReserve1.value
  const totalSupply = meshSwap.totalSupply()
  const token0 = meshSwap.token0()
  const token1 = meshSwap.token1()
  const positionFraction = BD_ONE.div(totalSupply.toBigDecimal().div(pow(BD_TEN, meshSwap.decimals())))

  const firstCoin = reserve0.toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token0).toI32()))
  const secondCoin = reserve1.toBigDecimal().times(positionFraction)
    .div(pow(BD_TEN, fetchContractDecimal(token1).toI32()))


  const token0Price = getPriceForCoin(token0)
  const token1Price = getPriceForCoin(token1)

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
}

// example poison/usdt
export function getPriceForUniswapV3(poolAddress: Address): BigDecimal {
  const pool =  UniswapV3PoolContract.bind(poolAddress)

  const trySlot0 = pool.try_slot0()

  if (trySlot0.reverted) {
    return BigDecimal.zero()
  }

  const sqrtPriceX96 = trySlot0.value.getSqrtPriceX96()

  const value = sqrtPriceX96.divDecimal(
    pow(BigDecimal.fromString('2'), 96)
  )

  const valueInPow = pow(value, 2)

  // TODO fix if you will you for other vaults
  // https://blog.uniswap.org/uniswap-v3-math-primer
  return valueInPow.times(pow(BD_TEN, 12))
}

export function toBigInt(value: BigDecimal): BigInt {
  const val = value.toString().split('.');
  if (val.length < 1) {
    return BigInt.zero();
  }
  return BigInt.fromString(val[0])
}