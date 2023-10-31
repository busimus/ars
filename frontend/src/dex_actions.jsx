import cloneDeep from 'lodash.clonedeep'

// all of this sucks in many ways, too late now

const BASE_COMMAND = {
  _description: "Unknown command",
  // _gasless: true,
  _gasless: true,
  _relayerAddr: null,
  _relayManually: false,
  _selectedRelayer: 'bus',
  _selectedTipToken: null,
  _baseSurplus: true,
  _quoteSurplus: true,
  _tipEstimates: { null: { text: 'No estimate yet', value: null, amount: 0 } },
  _gasPrice: null,
  tip: {
    token: null, amount: null, // recv: null, // always for now 256 - the relayer's signer
  },
}

export const COMMANDS = {
  null: {
    _type: null,
    text: 'Select a command',
  },
  swap: {
    _type: 'swap',
    text: 'Swap',
    base: null,
    quote: null,
    poolIdx: null,
    isBuy: null,
    qty: null,
    tip: 0,
    limitPrice: null,
    minOut: null,
    settleFlags: 3,

    _fromToken: null,
    _toToken: null,
    _fromQty: null,
    _fromQtyRaw: 0n,
    _toQty: null,
    _toQtyRaw: 0n,
    _slippage: 0.5,
    _estimate: null,
    _estimateTime: 0,
    ...cloneDeep(BASE_COMMAND),
  },
  withdraw: {
    _type: 'withdraw',
    text: 'Withdraw',
    recv: null,
    qty: null, // human string with decimal point
    token: null,
    _qtyRaw: null,
    ...cloneDeep(BASE_COMMAND),
  },
  deposit: {
    _type: 'deposit',
    text: 'Deposit',
    recv: null,
    qty: null, // human string with decimal point
    token: null,
    permit: null,
    _qtyRaw: null,
    ...cloneDeep(BASE_COMMAND),
  },
  transfer: {
    _type: 'transfer',
    text: 'Transfer to different DEX balance',
    recv: null,
    qty: null, // human string with decimal point
    token: null,
    _qtyRaw: null,
    ...cloneDeep(BASE_COMMAND),
  },
  removeConcLp: {
    _type: 'removeConcLp',
    text: 'Remove LP',
    code: 2,
    base: null,
    quote: null,
    poolIdx: null,
    bidTick: null,
    askTick: null,
    _rangeMin: 0.0, // human string with desimal point
    _rangeMax: 0.0,
    qty: null,
    limitLower: null,
    limitHigher: null,
    settleFlags: 3,
    lpConduit: null,
    positionType: 'concentrated',

    _slippage: 1,
    _qtyPct: 100,
    _baseDecimals: null,
    _quoteDecimals: null,
    ...cloneDeep(BASE_COMMAND),
  },
  removeAmbLp: {
    _type: 'removeAmbLp',
    text: 'Remove ambient LP',
    code: 3,
    base: null,
    quote: null,
    poolIdx: null,
    qty: null,
    limitLower: null,
    limitHigher: null,
    settleFlags: 3,
    lpConduit: null,
    positionType: 'ambient',

    _slippage: 1,
    _qtyPct: 100,
    _baseDecimals: null,
    _quoteDecimals: null,
    ...cloneDeep(BASE_COMMAND),
  },
}

export const SETTLE_TO_WALLET = 0
export const BASE_TO_DEX = 1
export const QUOTE_TO_DEX = 2
export const SETTLE_TO_DEX = 3
