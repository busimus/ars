import { formatUnits, hexToBigInt, encodeAbiParameters, keccak256, encodePacked } from "viem"
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

export function lpBaseTokens(pos, pool, percent = 100, human = false) {
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

export function lpQuoteTokens(pos, pool, percent = 100, human = false) {
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
  else if (chainId == 11155111)
    return "0x60bba138a74c5e7326885de5090700626950d509"
  else if (chainId == 7700)
    return "0xee602429ef7ece0a13e4ffe8dbc16e101049504c"
  else if (chainId == 81457)
    return "0x4300000000000000000000000000000000000003"
  else if (chainId == 168587773)
    return "0x4300000000000000000000000000000000000003"
  else if (chainId == 42161)
    return "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
  else if (chainId == 421613)
    return "0xc944b73fba33a773a4a07340333a3184a70af1ae"
  else if (chainId == 534351)
    return "0x4d65fb724ced0cfc6abfd03231c9cdc2c36a587b"
  else if (chainId == 534352)
    return "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"
  else if (chainId == 1923)
    return "0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34"
  else if (chainId == 98865)
    return "0x3938a812c54304feffd266c7e2e70b48f9475ad6"
  else if (chainId == 10143)
    return "0xf817257fed379853cde0fa4f97ab987181b1e5ea"
  else
    throw "chain not supported"
}

export function shortHash(hash, separator = '...', length = 4) {
  return hash.slice(0, 2 + length) + separator + hash.slice(-1 * length);
}

export function ambientPosSlot(owner, base, quote, poolType) {
  const poolHash = keccak256(encodeAbiParameters(
    [{ type: "address" }, { type: "address" }, { type: "uint256" }], [base, quote, poolType]))

  const posKey = keccak256(encodePacked(["address", "bytes32"], [owner, poolHash]))
  return keccak256(encodePacked(["bytes32", "uint256"],
    [posKey, AMBIENT_POS_SLOT]))
}

export function concPosSlot(owner, base, quote,
  lowerTick, upperTick, poolType) {
  const poolHash = keccak256(encodeAbiParameters(
    [{ type: "address" }, { type: "address" }, { type: "uint256" }], [base, quote, poolType]))

  const posKey = keccak256(encodePacked(["address", "bytes32", "int24", "int24"],
    [owner, poolHash, lowerTick, upperTick]))
  return keccak256(encodePacked(["bytes32", "uint256"],
    [posKey, CONC_POS_SLOT]))
}

export function genSimilarPositions(pos) {
  const positions = { p0: pos };
  const p1 = { ...pos };
  p1.askTick -= 1;
  positions.p1 = p1;
  const p2 = { ...pos };
  p2.askTick += 1;
  positions.p2 = p2;
  const p3 = { ...pos };
  p3.bidTick -= 1;
  positions.p3 = p3;
  const p4 = { ...pos };
  p4.bidTick += 1;
  positions.p4 = p4;
  const p5 = { ...pos };
  p5.bidTick -= 1;
  p5.askTick -= 1;
  positions.p5 = p5;
  const p6 = { ...pos };
  p6.bidTick += 1;
  p6.askTick += 1;
  positions.p6 = p6;
  const p7 = { ...pos };
  p7.bidTick -= 1;
  p7.askTick += 1;
  positions.p7 = p7;
  const p8 = { ...pos };
  p8.bidTick += 1;
  p8.askTick -= 1;
  positions.p8 = p8;

  // make a version of each position with negative bid/ask ticks
  for (let i = 0; i < 9; i++) {
    const p = { ...positions[`p${i}`] };
    const tmpBidTick = p.bidTick;
    p.bidTick = -p.askTick;
    p.askTick = -tmpBidTick;
    positions[`p${i + 9}`] = p;
  }
  return positions;
}

const AMBIENT_POS_SLOT = 65550;
const CONC_POS_SLOT = 65549;
