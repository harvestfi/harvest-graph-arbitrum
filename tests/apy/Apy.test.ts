import {
  assert,
  describe,
  test
} from "matchstick-as/assembly/index"
import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { calculateApr, calculateApy } from "../../src/utils/Apy";
import { BD_18 } from "../../src/utils/Constant";


describe("Apy tests", () => {
  test("Calculate apr and apy for FARM_USDC", () => {
    const tvlUsd = BigDecimal.fromString('34099398.320835760972')
    const period = BigDecimal.fromString('604800')
    const rewardUsdForPeriod = BigDecimal.fromString('33.99424')

    const apr = calculateApr(period, rewardUsdForPeriod, tvlUsd)
    const apy = calculateApy(apr)
    assert.assertTrue(apr.equals(BigDecimal.fromString('0.005201765917717593530268831793558803')))
    assert.assertTrue(apy.equals(BigDecimal.fromString('1.898644559966921638548123604649')))
  })

  test("Calculate apr and apy for FARM_USDC with new data", () => {
    const tvlUsd = BigDecimal.fromString('3359794')
    const period = BigDecimal.fromString('554806')
    // FARM token price in usd
    const rewardTokenPrice = BigDecimal.fromString('40')
    const rewardRate = BigDecimal.fromString('1285174768518')
    const rewardUsdForPeriod = rewardRate.div(BD_18).times(period).times(rewardTokenPrice)
    log.log(log.Level.INFO, `rewardUsdForPeriod = ${rewardUsdForPeriod}`)

    const apr = calculateApr(period, rewardUsdForPeriod, tvlUsd)
    const apy = calculateApy(apr)
    log.log(log.Level.INFO, `apr = ${apr}`)
    log.log(log.Level.INFO, `apy = ${apy}`)

    assert.assertTrue(apr.equals(BigDecimal.fromString('0.005201765917717593530268831793558803')))
    assert.assertTrue(apy.equals(BigDecimal.fromString('1.898644559966921638548123604649')))
  })
})