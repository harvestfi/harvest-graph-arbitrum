import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { pow } from "./Math";

export const UNKNOWN = 'unknown';

export const UNISWAP_V3_VALUE = pow(pow(BigDecimal.fromString('2'), 96), 2)
export const SECONDS_OF_YEAR = BigDecimal.fromString('31557600');
export const DEFAULT_DECIMAL = 18;
export const DEFAULT_PRICE = BigInt.fromI32(0);
export const YEAR_PERIOD = BigDecimal.fromString('365')
export const BI_TEN = BigInt.fromI64(10)
export const BI_18 = BigInt.fromI64(10 ** 18)
export const BD_18 = BigDecimal.fromString('1000000000000000000')
export const BD_ZERO = BigDecimal.fromString('0')
export const BD_ONE = BigDecimal.fromString('1')
export const BD_TEN = BigDecimal.fromString('10')
export const BD_ONE_HUNDRED = BigDecimal.fromString('100')
export const STABLE_COIN_ARRAY = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
  '0xe9e7cea3dedca5984780bafc599bd69add087d56'.toLowerCase(),
  '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(),
  '0x0000000000085d4780B73119b644AE5ecd22b376'.toLowerCase(),
  '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(),
]

export const PS_ADDRESSES = [
  '0xd3093e3efbe00f010e8f5efe3f1cb5d9b7fe0eb1'.toLowerCase(),
  '0x8f5adC58b32D4e5Ca02EAC0E293D35855999436C'.toLowerCase(),
  '0xa0246c9032bc3a600820415ae600c6388619a14d'.toLowerCase(),
  '0x25550Cccbd68533Fa04bFD3e3AC4D09f9e00Fc50'.toLowerCase(),
  '0x59258F4e15A5fC74A7284055A8094F58108dbD4f'.toLowerCase(),
]

export const LP_UNI_PAIR_CONTRACT_NAME = [
  '1inch'.toLowerCase(),
  'SushiSwap'.toLowerCase(),
  // only uniswap v2
  'Uniswap'.toLowerCase(),
  'Pancake'.toLowerCase(),
  'Kyber'.toLowerCase()
]
export const BALANCER_CONTRACT_NAME = 'Balancer'.toLowerCase()
export const CURVE_CONTRACT_NAME = 'Curve.fi'.toLowerCase()
export const F_UNI_V3_CONTRACT_NAME = 'fUniV3'.toLowerCase()

export const UNISWAP_V3_FEES = [
  '3000',
  '5000',
  '8000',
  '10000'
]

export const FARM_TOKEN = Address.fromString('0xa0246c9032bc3a600820415ae600c6388619a14d')

export const ORACLE_ADDRESS_FIRST = Address.fromString('0x48DC32eCA58106f06b41dE514F29780FFA59c279');
export const ORACLE_ADDRESS_SECOND = Address.fromString('0x1358c91D5b25D3eDAc2b7B26A619163d78f1717d');
export const NULL_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000');

