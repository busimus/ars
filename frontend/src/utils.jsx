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
    const msg = `This method only supports 0x-prefixed hex strings but string was: ${hexAddress}`;
    throw new Error(msg);
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

export function toDisplayPrice(price, _baseDecimals, _quoteDecimals, isInverted = false) {
  const scaled = price * Math.pow(10, _quoteDecimals - _baseDecimals)
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
