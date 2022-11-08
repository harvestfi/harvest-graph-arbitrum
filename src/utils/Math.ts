import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function pow(value: BigDecimal, scale: number): BigDecimal {
  let tempValue = value
  for (let i=0;i<scale;i++) {
    tempValue = tempValue.times(value)
  }
  return tempValue
}

export function powBI(value: BigInt, scale: number): BigInt {
  let tempValue = value
  for (let i=0;i<scale;i++) {
    tempValue = tempValue.times(value)
  }
  return tempValue
}