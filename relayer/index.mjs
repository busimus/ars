import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';

import { configureChains, createConfig } from '@wagmi/core'
import { mainnet, goerli, sepolia, scroll, scrollSepolia, canto } from 'viem/chains'
import { publicProvider } from '@wagmi/core/providers/public'
import { createPublicClient, createWalletClient, decodeAbiParameters, numberToHex, http, hexToBigInt, parseGwei, encodeFunctionData, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { CROC_CHAINS } from './constants.mjs'
import { CROC_ABI } from './abis/croc.mjs'
import { QUERY_ABI } from './abis/query.mjs'
import { decodeCrocPrice } from './utils.mjs';

const blast = defineChain({
  id: 81457,
  name: 'Blast',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.blast.io'] },
    default: { http: ['https://rpc.blast.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Blastscan',
      url: 'https://blastscan.io',
      apiUrl: 'https://api.blastscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 212929,
    },
  },
})

export const blastSepolia = defineChain({
  id: 168_587_773,
  name: 'Blast Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    public: {
      http: ['https://sepolia.blast.io'],
    },
    default: {
      http: ['https://sepolia.blast.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blastscan',
      url: 'https://sepolia.blastscan.io',
      apiUrl: 'https://api-sepolia.blastscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 756690,
    },
  },
  testnet: true,
})

const TRANSPORTS = {
  1: { http: http("https://rpc.flashbots.net/?builder=flashbots&builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=titan&builder=eigenphi&builder=boba-builder"), tx: http("https://rpc.flashbots.net/?builder=flashbots&builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=titan&builder=eigenphi&builder=boba-builder"), chain: mainnet },
  5: { http: http(`https://goerli.infura.io/v3/${process.env.INFURA_KEY}`), tx: http(`https://goerli.infura.io/v3/${process.env.INFURA_KEY}`), chain: goerli },
  11155111: { http: http(`https://rpc.sepolia.org`), tx: http(`https://rpc.sepolia.org`), chain: sepolia },
  7700: { http: http(`https://canto.gravitychain.io`), tx: http(`https://canto.gravitychain.io`), chain: canto },
  81457: { http: http(`https://rpc.blast.io`), tx: http(`https://rpc.blast.io`), chain: blast },
  168587773: { http: http(`https://sepolia.blast.io`), tx: http(`https://sepolia.blast.io`), chain: blastSepolia },
  534351: { http: http(`https://sepolia-rpc.scroll.io`), tx: http(`https://sepolia-rpc.scroll.io`), chain: scrollSepolia },
  534352: { http: http(`https://rpc.ankr.com/scroll/${process.env.ANKR_KEY}`), tx: http(`https://rpc.ankr.com/scroll/${process.env.ANKR_KEY}`), chain: scroll },
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const RELAY_SPEC = {
  tipTokens: {
    1: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", ZERO_ADDRESS, "0xdac17f958d2ee523a2206206994597c13d831ec7", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "0x6b175474e89094c44da98b954eedeac495271d0f"],
    5: [ZERO_ADDRESS, "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60", "0xc04b0d3107736c32e19f1c62b2af67be61d63a05"],
    7700: [ZERO_ADDRESS, "0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd"],
    42161: [ZERO_ADDRESS, "0xaf88d065e77c8cc2239327c5edb3a432268e5831", "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"],
    81457: ["0x4300000000000000000000000000000000000003", ZERO_ADDRESS],
    168587773: ["0x4300000000000000000000000000000000000003", ZERO_ADDRESS],
    534351: [ZERO_ADDRESS, '0x4d65fb724ced0cfc6abfd03231c9cdc2c36a587b'],
    534352: [ZERO_ADDRESS, "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4", "0xf55bec9cafdbe8730f096aa55dad6d22d44099df"],
  },
  tipRecv: [numberToHex(256, { size: 20 }), '0x09784d03b42581cfc4fc90a7ab11c3125dedeb86', '0xb4fdaf8e6636e7394f6ae768c5fa9d2e5bf6f0dc'],
  tipThreshold: 0.85,  // actual tip must at least cover this amount of gasFee
  maxFeePerGasIncrease: { 1: 1.25, 5: 5, 7700: 1.1, 42161: 1.25, 81457: 1.25, 421613: 5, 534351: 1.25, 534352: 1.25, 168587773: 5 },  // multiplies current gas by this number, based on chainId
}

const ALREADY_SENT = {}
const TX_STATUSES = {}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, blast, scroll, canto, sepolia, blastSepolia, scrollSepolia, goerli],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

if (process.env.DRY)
  console.log('Dry mode')

const CLIENTS = {}
for (const [chainId, transport] of Object.entries(TRANSPORTS)) {
  const client = createPublicClient({ chain: transport.chain, transport: transport.http })
  const wallet = createWalletClient({
    account: privateKeyToAccount(process.env.PK),
    chain: transport.chain, transport: transport.tx,
  })
  CLIENTS[chainId] = { client, wallet }
}

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

function parseTip(tip, chainId) {
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

  if (!RELAY_SPEC.tipTokens[chainId].includes(token))
    throw "Unsupported tip token"

  if (!RELAY_SPEC.tipRecv.includes(recv))
    throw "Incorrect tip receiver"

  return { token, amount }
}

async function convertTipToETH(token, amount, chainId) {
  console.log('converting tip', token, amount)
  if (token == ZERO_ADDRESS) {
    return amount
  } else {
    const price = await getPrice(token, ZERO_ADDRESS, chainId)
    const converted = BigInt(Math.round(parseInt(amount) * price))
    console.log('converted', converted)
    return converted
  }
  throw "bad tip"
}

async function getPrice(priceOf, relativeTo, chainId) {
  const invert = hexToBigInt(priceOf) > hexToBigInt(relativeTo)
  if (invert)
    [priceOf, relativeTo] = [relativeTo, priceOf]
  const pos = { base: priceOf, quote: relativeTo, poolIdx: CROC_CHAINS[chainId].poolIndex }
  const poolPrice = await fetchPoolPrice(pos, chainId)
  console.log('gotPrice', poolPrice)
  return poolPrice
}

async function fetchPoolPrice(pool, chainId) {
  const client = CLIENTS[chainId].client
  const price = await client.readContract({
    address: CROC_CHAINS[chainId].addrs.query, abi: QUERY_ABI, functionName: "queryPrice",
    args: [pool.base, pool.quote, pool.poolIdx]
  })
  console.log('raw price', price)
  return decodeCrocPrice(price)
}

async function estimateRelay(cmd) {
  const client = CLIENTS[cmd.chainId].client
  const wallet = CLIENTS[cmd.chainId].wallet
  let gas = await client.estimateContractGas({
    functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
    address: CROC_CHAINS[cmd.chainId].addrs.dex, abi: CROC_ABI,
    account: wallet.account
  })

  console.log('gas', gas)
  return gas
}

async function isTipEnough(cmd, gasPrice) {
  const { token, amount } = parseTip(cmd.tip, cmd.chainId)
  const ethTip = await convertTipToETH(token, amount, cmd.chainId)
  const gasNeeded = await estimateRelay(cmd)
  let gasFee = gasNeeded * gasPrice
  // l1fee for scroll
  if ([scroll.id, scrollSepolia.id].indexOf(cmd.chainId) != -1) {
    const calldata = encodeFunctionData({
      functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig], abi: CROC_ABI,
      // account: this.account
    })
    const call = {
      address: '0x5300000000000000000000000000000000000002', abi: [{ "inputs": [{ "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "getL1Fee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
      functionName: "getL1Fee", args: [calldata]
    }
    const client = CLIENTS[cmd.chainId].client
    const l1fee = await client.readContract(call)
    console.log('l1fee', l1fee)
    gasFee += l1fee * 130n / 100n
  }
  // l1fee for blast
  else if ([blast.id, blastSepolia.id].indexOf(cmd.chainId) != -1) {
    const calldata = encodeFunctionData({
      functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig], abi: CROC_ABI,
      // account: this.account
    })
    const call = {
      address: '0x420000000000000000000000000000000000000F', abi: [{ "inputs": [{ "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "getL1Fee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
      functionName: "getL1Fee", args: [calldata]
    }
    const client = CLIENTS[cmd.chainId].client
    const l1fee = await client.readContract(call)
    console.log('l1fee', l1fee)
    gasFee += l1fee * 115n / 100n
  }
  console.log('gasFee', gasFee, 'ethTip', ethTip)

  const ratio = parseInt(ethTip * 10000n / gasFee) / 10000
  console.log('tip ratio', ratio)
  if (ratio < RELAY_SPEC.tipThreshold)
    return false

  return true
}

async function sendRelayerTx(cmd, maxFeePerGas) {
  const client = CLIENTS[cmd.chainId].client
  const wallet = CLIENTS[cmd.chainId].wallet
  try {
    const maxPriorityFeePerGas = parseGwei('0.35') // # TODO: this sucks
    let tx = {
      functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
      address: CROC_CHAINS[cmd.chainId].addrs.dex, abi: CROC_ABI,
      // account: wallet.account,
      account: ZERO_ADDRESS,
    }
    if ([mainnet.id, canto.id, goerli.id, sepolia.id].indexOf(cmd.chainId) != -1) {
      tx.maxFeePerGas = maxFeePerGas
      tx.maxPriorityFeePerGas = maxFeePerGas < maxPriorityFeePerGas ? maxFeePerGas : maxPriorityFeePerGas
    } else {
      tx.gasPrice = maxFeePerGas
    }
    const sim = await client.simulateContract(tx)
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
  const client = CLIENTS[cmd.chainId].client
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

    const maxFeePerGas = BigInt(parseInt(parseInt(gasNow) * RELAY_SPEC.maxFeePerGasIncrease[cmd.chainId]))
    console.log('gasNow', gasNow, 'maxFeePerGas', maxFeePerGas)
    // throw "bad"
    const hash = await sendRelayerTx(cmd, maxFeePerGas)
    ALREADY_SENT[cmd.sig] = hash
    TX_STATUSES[hash] = 'PENDING'
    resp.success = true
    resp.hash = hash
    delete resp.reason
  } catch (e) {
    console.error('relay() error', e)
    resp.reason = `Internal relayer error`
  }
  return resp
}

async function txStatus(hash, chainId) {
  const status = { success: null, status: 'Unknown' }
  let knownStatus = TX_STATUSES[hash]
  if (knownStatus == 'PENDING' || knownStatus == 'UNKNOWN' || knownStatus == undefined) {
    if (chainId == mainnet.id) {
      const resp = await fetch(`https://protect.flashbots.net/tx/${hash}`)
      // console.log('Fetched flashbots status', resp)
      const json = await resp.json()
      // console.log('Flashbots status', json)
      TX_STATUSES[hash] = json.status
      knownStatus = json.status
    } else {
      try {
        const receipt = await client.getTransactionReceipt({ hash })
        // console.log('Fetched TX receipt', receipt)
        if (receipt.status == 'success') {
          TX_STATUSES[hash] = 'INCLUDED'
          knownStatus = 'INCLUDED'
        } else {
          TX_STATUSES[hash] = 'FAILED'
          knownStatus = 'FAILED'
        }
      } catch (e) {
        console.error('tx status error', e)
        TX_STATUSES[hash] = 'PENDING'
        knownStatus = 'PENDING'
      }
    }
  }

  if (knownStatus == 'PENDING') {
    status.success = null
    status.status = 'Pending'
  } else if (knownStatus == 'INCLUDED') {
    status.success = true
    status.status = 'Included'
  } else if (knownStatus == 'FAILED' || knownStatus == 'CANCELLED') {
    status.success = false
    status.status = 'Failed'
  }
  return status
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

app.get("/status", async (req, res) => {
  // const o = await client.getGasPrice()
  let resp = { success: null, status: 'Unknown' }
  try {
    const hash = req.query.tx
    if (true) {
      resp = await txStatus(hash, req.query.chainId)
      // resp = await txStatus(hash, false)
    } else {
      resp.success = false
      resp.status = 'Unknown transaction'
    }
  } catch (e) {
    console.error('txStatus() error', e)
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

