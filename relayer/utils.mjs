export function decodeCrocPrice(val) {
  const x = val < (Number.MAX_SAFE_INTEGER - 1)
    ? parseInt(val)
    : parseFloat(val.toString());
  const sq = x / 2 ** 64;
  return sq * sq;
}

export function poolKey(position) {
  if (hexToBigInt(position.base) < hexToBigInt(position.quote))
    return `${position.base}_${position.quote}_${position.poolIdx}`
  else
    return `${position.quote}_${position.base}_${position.poolIdx}`
}
