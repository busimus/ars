import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';

import { configureChains, createConfig, getPublicClient, getWalletClient } from '@wagmi/core'
// import { mainnet, goerli } from '@wagmi/core/chains'
import { mainnet, goerli } from 'viem/chains'
import { publicProvider } from '@wagmi/core/providers/public'
import { createPublicClient, createWalletClient, encodeAbiParameters, decodeAbiParameters, numberToHex, http, hexToBigInt, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { CROC_CHAINS } from './constants.mjs'
import { CROC_ABI } from './abis/croc.mjs'
import { QUERY_ABI } from './abis/query.mjs'
import { decodeCrocPrice } from './utils.mjs';


const TRANSPORTS = {
  1: { http: http("https://rpc.flashbots.net/?hint=calldata&hint=logs&hint=hash"), tx: http("https://rpc.flashbots.net/?hint=calldata&hint=logs&hint=hash") },
  5: { http: http("https://goerli.infura.io/v3/afea1acbc0be4ad7bf22a841a0e7ef63"), tx: http("https://goerli.infura.io/v3/afea1acbc0be4ad7bf22a841a0e7ef63") },
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const RELAY_SPEC = {
  tipTokens: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", ZERO_ADDRESS],
  tipRecv: [numberToHex(256, { size: 20 }), '0x09784d03b42581cfc4fc90a7ab11c3125dedeb86', '0xb4fdaf8e6636e7394f6ae768c5fa9d2e5bf6f0dc'],
  tipThreshold: 1.2,  // actual gasFee must be at most this much higher than tip
  maxFeePerGasIncrease: 1.25,  // multiplies current gas by this
}

const ALREADY_SENT = {}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, goerli],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

let CHAIN = mainnet
if (process.env.CHAIN == '5')
  CHAIN = goerli
// const CHAIN = mainnet
console.log(`Using chain: ${CHAIN.id}`)
if (process.env.DRY)
  console.log('Dry mode')

const client = createPublicClient({ chain: CHAIN, transport: TRANSPORTS[CHAIN.id].http })
const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PK),
  chain: CHAIN, transport: TRANSPORTS[CHAIN.id].tx,
})

const app = express();
// dirty response logging hack
const originalSend = app.response.send
app.response.send = function sendOverWrite(body) {
  originalSend.call(this, body)
  this.__custombody__ = body
}

app.use(cors());
app.use(express.json({ type: "*/*" }))

const logFormat = ":date[iso] - :url - :status - :response-time ms - :body - :res-body"
const accessLogStream = fs.createWriteStream(
  'relayer.log',
  {
    flags: 'a',
  }
);
morgan.token('body', (req, res) => JSON.stringify(req.body))
morgan.token('res-body', (_req, res) =>
  res.__custombody__,
)

app.use(
  morgan(logFormat, {
    stream: accessLogStream,
  })
);

app.use(morgan(logFormat));

function parseTip(tip) {
  if (tip == '0x')
    throw "No tip attached"
  let [token, amount, recv] = decodeAbiParameters(
    [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'recv', type: 'address' },
    ],
    tip
  )
  console.log('parsed tip', token, amount, recv)
  token = token.toLowerCase()
  recv = recv.toLowerCase()

  if (!RELAY_SPEC.tipTokens.includes(token))
    throw "Unsupported tip token"

  if (!RELAY_SPEC.tipRecv.includes(recv))
    throw "Incorrect tip receiver"

  return { token, amount }
}

async function convertTipToETH(token, amount) {
  console.log('converting tip', token, amount)
  if (token == ZERO_ADDRESS) {
    return amount
  } else if (["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c"].includes(token)) {
    const price = await getPrice(token, ZERO_ADDRESS)
    const converted = BigInt(Math.round(parseInt(amount) * price))
    console.log('converted', converted)
    return converted
  }
  throw "bad tip"
}

async function fetchPoolPrice(pool) {
  const price = await client.readContract({
    address: CROC_CHAINS[CHAIN.id].addrs.query, abi: QUERY_ABI, functionName: "queryPrice",
    args: [pool.base, pool.quote, pool.poolIdx]
  })
  return decodeCrocPrice(price)
}

async function getPrice(priceOf, relativeTo) {
  const invert = hexToBigInt(priceOf) > hexToBigInt(relativeTo)
  if (invert)
    [priceOf, relativeTo] = [relativeTo, priceOf]
  const pos = { base: priceOf, quote: relativeTo, poolIdx: CROC_CHAINS[CHAIN.id].poolIndex }
  const poolPrice = await fetchPoolPrice(pos)
  console.log('gotPrice', poolPrice)
  return poolPrice
}

async function estimateRelay(cmd) {
  let gas = await client.estimateContractGas({
    functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
    address: CROC_CHAINS[CHAIN.id].addrs.dex, abi: CROC_ABI,
    account: wallet.account
  })

  console.log('gas', gas)
  return gas
}

async function isTipEnough(cmd, gasPrice) {
  const { token, amount } = parseTip(cmd.tip)
  const ethTip = await convertTipToETH(token, amount)
  const gasNeeded = await estimateRelay(cmd)
  const gasFee = gasNeeded * gasPrice
  console.log('gasFee', gasFee, 'ethTip', ethTip)

  const ratio = parseInt(gasFee * 10000n / ethTip) / 10000
  if (ratio > RELAY_SPEC.tipThreshold)
    return false

  return true
}

async function sendRelayerTx(cmd, maxFeePerGas) {
  try {
    const sim = await client.simulateContract({
      functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
      address: CROC_CHAINS[CHAIN.id].addrs.dex, abi: CROC_ABI,
      // account: wallet.account,
      account: ZERO_ADDRESS,
      maxFeePerGas, maxPriorityFeePerGas: parseGwei('0.5'),
    })
    console.log('sim', sim)
    sim.request.account = wallet.account
    if (process.env.DRY)
      return "0xdccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    else
      return await wallet.writeContract(sim.request)
  } catch (e) {
    console.error('sendRelayerTx error', e)
    throw e
  }
}

async function relay(cmd) {
  const resp = { success: false, reason: "" }
  try {
    const gasNow = await client.getGasPrice()
    console.log('gasNow', gasNow)

    if (!(await isTipEnough(cmd, gasNow))) {
      resp.reason = "Tip doesn't cover the gas, refresh and try again"
      return resp
    }

    const alreadyHash = ALREADY_SENT[cmd.sig]
    if (alreadyHash) {
      resp.reason = `Already sent this command, TX hash: ${alreadyHash}`
      return resp
    }

    const maxFeePerGas = BigInt(parseInt(parseInt(gasNow) * RELAY_SPEC.maxFeePerGasIncrease))
    console.log('gasNow', gasNow, 'maxFeePerGas', maxFeePerGas)
    // throw "bad"
    const hash = await sendRelayerTx(cmd, maxFeePerGas)
    ALREADY_SENT[cmd.sig] = hash
    resp.success = true
    resp.hash = hash
    delete resp.reason
  } catch (e) {
    console.error('relay() error', e)
    resp.reason = `Internal relayer error`
  }
  return resp
}

app.post("/relay", async (req, res) => {
  // const o = await client.getGasPrice()
  let resp = { success: false, reason: 'Internal error' }
  try {
    const cmd = req.body
    console.log('Received cmd:', cmd)
    if (!cmd || cmd == {} || Object.keys(cmd).length == 0) {
      res.status(400).json({ success: false, reason: "Empty command" })
      return
    }
    resp = await relay(cmd)
  } catch (e) {
    console.error('relay() error', e)
    res.status(500).json(resp);
    return
  }
  res.status(200).json(resp);
});

import process from 'process'
process.on('SIGINT', () => {
  console.log("SIGINT")
  process.exit(0)
})
process.on('SIGTERM', () => {
  console.log("SIGTERM")
  process.exit(0)
})

app.listen(80);

