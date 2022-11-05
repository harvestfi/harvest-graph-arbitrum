import { CreatePoolCall, PoolCreated } from "../generated/UniswapV3Factory/UniswapV3FactoryContract";
import { UniswapV3Pool } from "../generated/schema";
import { loadOrCreateERC20Token } from "./utils/Token";

export function handlePoolCreated(event: PoolCreated): void {
  const tokenA = loadOrCreateERC20Token(event.params.token0)
  const tokenB = loadOrCreateERC20Token(event.params.token1)
  const fee = event.params.fee
  const pool = event.params.pool
  const id = `${tokenA.symbol.toLowerCase()}-${tokenB.symbol.toLowerCase()}-${fee}`

  let uniswapPool = UniswapV3Pool.load(id)
  if (uniswapPool == null) {
    uniswapPool = new UniswapV3Pool(id)
    uniswapPool.tokenA = tokenA.id
    uniswapPool.tokenB = tokenB.id
    uniswapPool.pool = pool.toHex()
    uniswapPool.save()
  }
}