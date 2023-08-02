import cloneDeep from 'lodash.clonedeep'

const BASE_COMMAND = {
  _description: "Unknown command",
  // _useRelayer: true,
  _useRelayer: true,
  _relayerAddr: null,
  _relayManually: false,
  _selectedRelayer: 'bus',
  _selectedTipToken: null,
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

    _toToken: "0x0000000000000000000000000000000000000000",
    _fromQty: '100',
    _fromToken: "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c",
    // _fromToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    // _toToken: "0xc04b0d3107736c32e19f1c62b2af67be61d63a05",
    _toQty: null,
    _slippage: 1.0,
    _estimate: null,
    ...cloneDeep(BASE_COMMAND),
  },
  withdraw: {
    _type: 'withdraw',
    text: 'Withdraw DEX balance',
    recv: null,
    qty: null, // human string with decimal point
    token: null,
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

// no need for proper bitflags yet
export const SETTLE_TO_WALLET = 0
export const BASE_TO_DEX = 1
export const QUOTE_TO_DEX = 2
export const SETTLE_TO_DEX = 3

// no need for proper bitflags yet
export const SETTLE_FLAGS = [
  {
    value: SETTLE_TO_WALLET,
    text: 'To wallet',
  },
  //  1: {
  //    value: 1,
  //    text: 'Base to DEX balance',
  //  },
  //  2: {
  //    value: 2,
  //    text: 'Quote to DEX balance',
  //  },
  {
    value: SETTLE_TO_DEX,
    text: 'To DEX balance',
  },
]
