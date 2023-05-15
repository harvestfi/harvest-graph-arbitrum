import { TotalTvlUtil } from '../../generated/schema';
import { Address, BigDecimal, ethereum } from '@graphprotocol/graph-ts';
import { CONST_ID } from '../utils/Constant';
import { createTvl, createTvlV2 } from './Tvl';

export function pushVault(address: string, block: ethereum.Block): void {
  const vaultUtils = getTvlUtils(block);

  let array = vaultUtils.vaults
  array.push(address)
  vaultUtils.vaults = array
  vaultUtils.save()
}

export function getTvlUtils(block: ethereum.Block): TotalTvlUtil {
  let vaultUtils = TotalTvlUtil.load(CONST_ID);
  if (vaultUtils == null) {
    vaultUtils = new TotalTvlUtil(CONST_ID)
    vaultUtils.vaults = [];
    vaultUtils.lastTimestampUpdate = block.timestamp
    vaultUtils.timestamp = block.timestamp
    vaultUtils.createAtBlock = block.number
    vaultUtils.save()
  }

  return vaultUtils;
}

export function createTotalTvl(block: ethereum.Block): void {
  const tvlUtils = getTvlUtils(block)
  let totalTvl = BigDecimal.zero()
  const array = tvlUtils.vaults
  for (let i = 0; i < array.length; i++) {
    const tvl = createTvl(Address.fromString(array[i]), block)
    if (tvl) {
      totalTvl = totalTvl.plus(tvl.value)
    }
  }
  createTvlV2(totalTvl, block);
  tvlUtils.lastTimestampUpdate = block.timestamp
  tvlUtils.save()
}