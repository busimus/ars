import { formatUnits, hexToBigInt } from "viem"
import { getFormattedNumber } from "./number_formatting.jsx"
import { baseTokenForConcLiq, quoteTokenForConcLiq, floatToBigNum, tickToPrice } from '@crocswap-libs/sdk'

export function isHexString(value, length = null) {
  if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/))
    return false;

  if (length && value.length !== 2 + 2 * length) return false;

  return true;
}

export function isValidAddress(hexAddress) {
  if (!isHexString(hexAddress)) {
    return false
  }
  return /^0x[0-9a-fA-F]{40}$/.test(hexAddress);
}

export function decodeCrocPrice(val) {
  const x = val < (Number.MAX_SAFE_INTEGER - 1)
    ? parseInt(val)
    : parseFloat(val.toString());
  const sq = x / 2 ** 64;
  return sq * sq;
}

export function toDisplayPrice(price, baseDecimals, quoteDecimals, isInverted = false) {
  const scaled = price * Math.pow(10, quoteDecimals - baseDecimals)
  return isInverted ? 1 / scaled : scaled
}

export function lpBaseTokens(pos, pool, percent=100, human=false) {
  const liq = parseInt(pos.qty) / 100 * percent
  let baseQty = 0
  if (pos.positionType == 'concentrated') {
    baseQty = baseTokenForConcLiq(pool.priceDecoded, floatToBigNum(liq), tickToPrice(pos.bidTick), tickToPrice(pos.askTick)).toBigInt()
  } else {
    baseQty = BigInt(parseInt(liq * Math.sqrt(pool.priceDecoded)));
  }
  if (human)
    return getFormattedNumber(parseFloat(formatUnits(baseQty, pos._baseDecimals)))
  else
    return baseQty
}

export function lpQuoteTokens(pos, pool, percent=100, human=false) {
  const liq = parseInt(pos.qty) / 100 * percent
  let quoteQty = 0
  if (pos.positionType == 'concentrated') {
    quoteQty = quoteTokenForConcLiq(pool.priceDecoded, floatToBigNum(liq), tickToPrice(pos.bidTick), tickToPrice(pos.askTick)).toBigInt()
  } else {
    quoteQty = BigInt(parseInt(liq / Math.sqrt(pool.priceDecoded)));
  }
  if (human)
    return getFormattedNumber(parseFloat(formatUnits(quoteQty, pos._quoteDecimals)))
  else
    return quoteQty
}

export function poolKey(position) {
  if (hexToBigInt(position.base) < hexToBigInt(position.quote))
    return `${position.base}_${position.quote}_${position.poolIdx}`
  else
    return `${position.quote}_${position.base}_${position.poolIdx}`
}

export function dump(o) {
  return JSON.stringify(o, (key, value) =>
    typeof value === 'bigint'
	? value.toString()
	: value
  );
}

export function getSomeTokenForChain(chainId) {
  if (chainId == 1)
    return "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  else if (chainId == 5)
    return "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c"
  else if (chainId == 42161)
    return "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
  else if (chainId == 421613)
    return "0xc944b73fba33a773a4a07340333a3184a70af1ae"
  else if (chainId == 534351)
    return "0x4d65fb724ced0cfc6abfd03231c9cdc2c36a587b"
  else if (chainId == 534352)
    return "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"
  else
    throw "chain not supported"
}
