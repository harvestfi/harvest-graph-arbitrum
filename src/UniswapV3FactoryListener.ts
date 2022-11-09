import { CreatePoolCall, PoolCreated } from "../generated/UniswapV3Factory/UniswapV3FactoryContract";
import { UniswapV3Pool } from "../generated/schema";
import { loadOrCreateERC20Token } from "./utils/Token";

export function handleCreatePool(call: CreatePoolCall): void {
  const tokenA = loadOrCreateERC20Token(call.inputs.tokenA)
  const tokenB = loadOrCreateERC20Token(call.inputs.tokenB)
  const fee = call.inputs.fee
  const pool = call.outputs.pool
  const id = `${tokenA.symbol.toLowerCase()}-${tokenB.symbol.toLowerCase()}-${fee}`

  let uniswapPool = UniswapV3Pool.load(id)
  if (uniswapPool == null) {
    uniswapPool = new UniswapV3Pool(id)
    uniswapPool.tokenA = tokenA.id
    uniswapPool.tokenB = tokenB.id
    uniswapPool.pool = pool.toHex()
    uniswapPool.createAtBlock = call.block.number
    uniswapPool.timestamp = call.block.timestamp
    uniswapPool.save()
  }
}