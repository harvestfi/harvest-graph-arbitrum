import { Bytes } from '@graphprotocol/graph-ts';

export function stringIdToBytes(value: string): Bytes {
  return Bytes.fromUTF8(value.toLowerCase());
}