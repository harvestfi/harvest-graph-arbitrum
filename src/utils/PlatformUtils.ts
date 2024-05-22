import {
  BTC_POOLS,
  BALANCER_CONTRACT_NAME,
  CAMELOT_CONTRACT,
  CURVE_CONTRACT_NAME,
  F_UNI_V3_CONTRACT_NAME,
  LP_UNI_PAIR_CONTRACT_NAME,
  MAGPIE_CONTRACT,
  MESH_SWAP_CONTRACT,
  POISON_FINANCE_CONTRACT,
  WETH_LIST,
  WST_ETH_LIST,
  ARB_POOL,
  GAMMA_VAULTS_NAME, STABLE_COIN_POOL_ARRAY, CONVEX_POOL_LIST,
} from './Constant';
import { WeightedPool2TokensContract } from '../../generated/Controller/WeightedPool2TokensContract';
import { Address } from '@graphprotocol/graph-ts';
import { CamelotUniswapV3Vault } from '../../generated/Controller/CamelotUniswapV3Vault';
import { GammaVaultContract } from '../../generated/Controller/GammaVaultContract';

export function isLpUniPair(name: string): boolean {
  for (let i = 0; i < LP_UNI_PAIR_CONTRACT_NAME.length; i++) {
    if (name.toLowerCase().startsWith(LP_UNI_PAIR_CONTRACT_NAME[i])) {
      return true;
    }
  }
  return false;
}

export function isGammaLpUniPair(name: string): boolean {
  for (let i = 0; i < GAMMA_VAULTS_NAME.length; i++) {
    if (name.toLowerCase().startsWith(GAMMA_VAULTS_NAME[i])) {
      return true;
    }
  }
  return false;
}

export function isGammaVault(name: string, address: string): boolean {
  return !!(name.toLowerCase().startsWith('a') &&
    !GammaVaultContract.bind(Address.fromString(address)).try_getBasePosition().reverted);
}

export function isBalancer(name: string): boolean {
  for (let i = 0; i < BALANCER_CONTRACT_NAME.length; i++) {
    if (name.toLowerCase().startsWith(BALANCER_CONTRACT_NAME[i])) {
      return true;
    }
  }
  return false;
}

export function isCurve(name: string): boolean {
  for (let i = 0; i < CURVE_CONTRACT_NAME.length; i++) {
    if (name.toLowerCase().startsWith(CURVE_CONTRACT_NAME[i])) {
      return true;
    }
  }
  return false;
}

export function isUniswapV3(name: string): boolean {
  if (name.toLowerCase().startsWith(F_UNI_V3_CONTRACT_NAME)) {
    return true;
  }
  return false;
}

export function isMeshSwap(name: string): boolean {
  if (name.toLowerCase().startsWith(MESH_SWAP_CONTRACT)) {
    return true;
  }
  return false;
}

export function isCamelot(name: string): boolean {
  return !!name.toLowerCase().startsWith(CAMELOT_CONTRACT);
}

export function isPoisonFinanceToken(name: string): boolean {
  return name.toLowerCase() == POISON_FINANCE_CONTRACT;
}

export function checkBalancer(address: Address): boolean {
  const contract = WeightedPool2TokensContract.bind(address);
  return !contract.try_getPoolId().reverted;
}

export function isWsteth(address: Address): boolean {
  for (let i = 0; i < WST_ETH_LIST.length; i++) {
    if (address.equals(WST_ETH_LIST[i])) {
      return true;
    }
  }
  return false;
}

export function isWeth(address: Address): boolean {
  for (let i = 0; i < WETH_LIST.length; i++) {
    if (address.equals(WETH_LIST[i])) {
      return true;
    }
  }

  return false;
}

export function isBtc(address: string): boolean {
  for (let i = 0; i < BTC_POOLS.length; i++) {
    if (address.toLowerCase() == BTC_POOLS[i]) {
      return true;
    }
  }

  return false;
}

export function isStablePool(address: string): boolean {
  for (let i = 0; i < STABLE_COIN_POOL_ARRAY.length; i++) {
    if (address.toLowerCase() == STABLE_COIN_POOL_ARRAY[i]) {
      return true;
    }
  }
  return false;
}

export function isArb(address: string): boolean {
  for (let i = 0; i < ARB_POOL.length; i++) {
    if (address.toLowerCase() == ARB_POOL[i]) {
      return true;
    }
  }
  return false;
}

export function isConvex(address: string): boolean {
  for (let i = 0; i < CONVEX_POOL_LIST.length; i++) {
    if (address.toLowerCase() == CONVEX_POOL_LIST[i]) {
      return true;
    }
  }
  return false;
}

export function isCamelotUniswapV3(name: string, address: string): boolean {
  if (!name.toLowerCase().startsWith('a')) {
    return false;
  }
  return !CamelotUniswapV3Vault.bind(Address.fromString(address)).try_getTotalAmounts().reverted;
}

export function isMagpie(name: string): boolean {
  return !!name.startsWith(MAGPIE_CONTRACT);
}