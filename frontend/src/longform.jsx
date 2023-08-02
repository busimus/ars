// this is longform.ts from the SDK, which is not reexported for some reason??

import { BigNumber, ethers } from "ethers"

export class OrderDirective {
  constructor(openToken) {
    this.open = simpleSettle(openToken)
    this.hops = []
  }

  encodeBytes() {
    let schema = encodeWord(LONG_FORM_SCHEMA_TYPE)
    let open = encodeSettlement(this.open)
    let hops = listEncoding(this.hops, encodeHop)
    return ethers.utils.concat([schema, open, hops])
  }

  appendHop(nextToken) {
    const hop = {
      settlement: simpleSettle(nextToken),
      pools: [],
      improve: { isEnabled: false, useBaseSide: false }
    }
    this.hops.push(hop)
    return hop
  }

  appendPool(poolIdx) {
    const pool = {
      poolIdx: poolIdx,
      passive: {
        ambient: { isAdd: false, rollType: 0, liquidity: BigNumber.from(0) },
        concentrated: []
      },
      swap: {
        isBuy: false,
        inBaseQty: false,
        rollType: 0,
        qty: BigNumber.from(0),
        limitPrice: BigNumber.from(0)
      },
      chain: { rollExit: false, swapDefer: false, offsetSurplus: false }
    }
    this.hops.at(-1).pools.push(pool)
    return pool
  }

  appendRangeMint(lowTick, highTick, liq) {
    const range = {
      lowTick: lowTick,
      highTick: highTick,
      isRelTick: false,
      isAdd: true,
      rollType: 0,
      liquidity: BigNumber.from(liq).abs()
    }
    const pool = this.hops.at(-1).pools.at(-1)
    pool.passive.concentrated.push(range)
    return range
  }

  appendAmbientMint(liq) {
    const pool = this.hops.at(-1).pools.at(-1)
    pool.passive.ambient = {
      isAdd: true,
      rollType: 0,
      liquidity: BigNumber.from(liq).abs()
    }
    return pool.passive.ambient
  }

  appendRangeBurn(lowTick, highTick, liq) {
    let range = this.appendRangeMint(lowTick, highTick, liq)
    range.isAdd = false
    return range
  }
}

const LONG_FORM_SCHEMA_TYPE = 1

function simpleSettle(token) {
  return {
    token: token,
    limitQty: BigNumber.from(2).pow(125),
    dustThresh: BigNumber.from(0),
    useSurplus: false
  }
}

function encodeSettlement(dir) {
  let token = encodeToken(dir.token)
  let limit = encodeSigned(dir.limitQty)
  let dust = encodeFull(dir.dustThresh)
  let reserveFlag = encodeWord(dir.useSurplus ? 1 : 0)
  return ethers.utils.concat([token, limit, dust, reserveFlag])
}

function encodeHop(hop) {
  let pools = listEncoding(hop.pools, encodePool)
  let settle = encodeSettlement(hop.settlement)
  let improve = encodeImprove(hop.improve)
  return ethers.utils.concat([pools, settle, improve])
}

function encodeImprove(improve) {
  let abiCoder = new ethers.utils.AbiCoder()
  return abiCoder.encode(
    ["bool", "bool"],
    [improve.isEnabled, improve.useBaseSide]
  )
}

function encodeChain(chain) {
  let abiCoder = new ethers.utils.AbiCoder()
  return abiCoder.encode(
    ["bool", "bool", "bool"],
    [chain.rollExit, chain.swapDefer, chain.offsetSurplus]
  )
}

function encodePool(pool) {
  let poolIdx = encodeFull(pool.poolIdx)
  let passive = encodePassive(pool.passive)
  let swap = encodeSwap(pool.swap)
  let chain = encodeChain(pool.chain)
  return ethers.utils.concat([poolIdx, passive, swap, chain])
}

function encodeSwap(swap) {
  let abiCoder = new ethers.utils.AbiCoder()
  return abiCoder.encode(
    ["bool", "bool", "uint8", "uint128", "uint128"],
    [
      swap.isBuy,
      swap.inBaseQty,
      swap.rollType ? swap.rollType : 0,
      swap.qty,
      swap.limitPrice
    ]
  )
}

function encodePassive(passive) {
  let ambAdd = encodeBool(passive.ambient.isAdd)
  let rollType = encodeWord(
    passive.ambient.rollType ? passive.ambient.rollType : 0
  )
  let ambLiq = encodeFull(passive.ambient.liquidity)
  let conc = listEncoding(passive.concentrated, encodeConc)
  return ethers.utils.concat([ambAdd, rollType, ambLiq, conc])
}

function encodeConc(conc) {
  let openTick = encodeJsSigned(conc.lowTick)
  let closeTick = encodeJsSigned(conc.highTick)
  let isRelTick = encodeBool(conc.isRelTick)
  let isAdd = encodeBool(conc.isAdd)
  let rollType = encodeWord(conc.rollType ? conc.rollType : 0)
  let liq = encodeFull(conc.liquidity)
  return ethers.utils.concat([
    openTick,
    closeTick,
    isRelTick,
    isAdd,
    rollType,
    liq
  ])
}

function listEncoding(elems, encoderFn) {
  let count = encodeWord(elems.length)
  let vals = elems.map(encoderFn)
  return ethers.utils.concat([count].concat(vals))
}

function encodeToken(tokenAddr) {
  return ethers.utils.hexZeroPad(tokenAddr, 32)
}

function encodeFull(val) {
  let abiCoder = new ethers.utils.AbiCoder()
  return abiCoder.encode(["uint256"], [val])
}

function encodeSigned(val) {
  let abiCoder = new ethers.utils.AbiCoder()
  return abiCoder.encode(["int256"], [val])
}

function encodeJsNum(val) {
  return encodeFull(BigNumber.from(val))
}

function encodeJsSigned(val) {
  return encodeSigned(BigNumber.from(val))
}

function encodeWord(val) {
  return encodeJsNum(val)
}

function encodeBool(flag) {
  return encodeWord(flag ? 1 : 0)
}
