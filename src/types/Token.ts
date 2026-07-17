import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Token, TokenInPrice } from '../../generated/schema';
import { ERC20 } from "../../generated/Controller/ERC20";
import { BI_12_HOURS, BI_4_HOURS, DEFAULT_DECIMAL, UNKNOWN } from '../utils/Constant';
import { getPriceForCoin } from '../utils/PriceUtils';

export function loadOrCreateERC20Token(tokenAddress: Address): Token{
  let tokenContract = ERC20.bind(tokenAddress)
  let token = Token.load(tokenAddress.toHex())
  if (token == null) {
    token = new Token(tokenAddress.toHex())
    token.name = tokenContract.try_name().reverted ? UNKNOWN : tokenContract.name();
    token.symbol = tokenContract.try_symbol().reverted ? UNKNOWN : tokenContract.symbol()
    token.decimals = tokenContract.try_decimals().reverted ? DEFAULT_DECIMAL :tokenContract.decimals()
    token.save()
  }
  return token as Token
}

export function getTokenInPrice(address: Address, timestamp: BigInt): TokenInPrice {
  const id = Bytes.fromUTF8(address.toHex());
  let tokenInPrice = TokenInPrice.load(id);
  if (!tokenInPrice) {
    tokenInPrice = new TokenInPrice(id);
    tokenInPrice.price = getPriceForCoin(address);
    tokenInPrice.lastUpdate = timestamp;
    tokenInPrice.save();
    return tokenInPrice;
  }
  if (timestamp.gt(tokenInPrice.lastUpdate.plus(BI_4_HOURS))) {
    tokenInPrice.price = getPriceForCoin(address);
    tokenInPrice.lastUpdate = timestamp;
    tokenInPrice.save();
  }
  return tokenInPrice;
}