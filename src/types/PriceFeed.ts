import { PriceFeed, Vault } from '../../generated/schema';
import { BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { pow } from '../utils/MathUtils';
import { BD_TEN } from '../utils/Constant';
import { stringIdToBytes } from '../utils/IdUtils';

export function createPriceFeed(vault: Vault, price: BigDecimal, timestamp: BigInt = BigInt.zero(), block: BigInt = BigInt.zero()): PriceFeed {
  const id = Bytes.fromUTF8(`${vault.id}-${block}`);
  let priceFeed = PriceFeed.load(id);
  if (!priceFeed) {
    priceFeed = new PriceFeed(id);
    priceFeed.vault = vault.id
    priceFeed.price = price;
    priceFeed.sharePrice = BigDecimal.fromString('1');
    priceFeed.value = BigDecimal.zero();
    priceFeed.createAtBlock = block
    priceFeed.timestamp = timestamp

    if (vault.lastSharePrice.gt(BigInt.zero())) {
      const sharePrice = vault.lastSharePrice.divDecimal(pow(BD_TEN, vault.decimal.toI32()))
      priceFeed.sharePrice = sharePrice;
      priceFeed.value = price.times(sharePrice);
    }
    priceFeed.priceFeedSequenceId = vault.priceFeedSequenceId;
    priceFeed.save();
  }

  return priceFeed;
}