<!--
  Small warning:
  Most of the code in this project was written under a time constraint and
  intended to be used by one person (before I decided to release it publicly).
  This doesn't excuse some of the horrors you might encounter, but hopefully
  it will at least explain them.
-->
<template>
  <div id="wrapper">
    <div id="main-ui-wrapper" style="padding-top: 0.5em; padding-bottom: 0.5em" class="container-fluid">
      <div class="main-panel panel-col border shadow-sm rounded"
        style="margin-bottom: 0.5rem; margin-left:auto; margin-right: auto;">
        <img id="logo" alt="Ambient Relay Service" src="./assets/ars_logo.svg" style="margin-bottom: 0.7rem" />
        <a href="#collapseIndicatorChevronDark" v-b-toggle.collapse-about @click.prevent class="text-center"
          style="display: block;  margin-bottom: 0.5rem;" data-bs-toggle="collapse" aria-expanded="false"
          aria-controls="collapseIndicatorChevronDark">
          About
          <b-icon-chevron-down class="when-closed" />
          <b-icon-chevron-up class="when-open" />
        </a>
        <b-collapse id="collapse-about" style="text-align: justify;">
          <p style="margin-bottom: 0.5rem;">
            This is an alternative frontend for <a href="https://ambient.finance" target="_blank">Ambient
              Finance</a>.
          </p>
          <p style="margin-bottom: 0.5rem;">
            You can use it to send gasless transactions by tipping gas
            out of your DEX balance.
          </p>
        </b-collapse>
        <hr ref="aboveWalletContainer" style="margin-top: 0rem; margin-bottom: 0.5rem" />

        <div id="w3-button-container">
          <div v-if="!address">
            <b-button variant="primary" @click="w3modal">Connect wallet</b-button>
            <hr style="margin-top: 0.5rem; margin-bottom: 0.5rem" />
            <span style="text-align: center;">Connect wallet to see positions and balances</span>
          </div>
          <div id="w3-connected" v-else class="border" @click="w3modal">
            <span style="margin-top: auto; margin-bottom: auto; white-space: pre;">
              <b-avatar id="chainImage" size="sm" :src="CHAIN_IMAGES[this.chainId || 1]"></b-avatar>
              <b-tooltip target="chainImage" triggers="hover">
                Connected to {{ chain.chain.name }}
              </b-tooltip>
              <strong style="margin-left: 0.3rem; vertical-align: middle;">{{ this.ethBalance }}</strong>
            </span>
            <b-button id="w3-address-pill" :class="{ 'with-avatar': this.ensAvatar }" pill variant="primary"
              @click="w3modal">
              <b-avatar size="sm" v-if="this.ensAvatar" :src="this.ensAvatar"></b-avatar>
              <span style="overflow: hidden; text-overflow: ellipsis;">
                {{ this.ensName ? this.ensName :
                  shortHash(this.address) }}</span>
            </b-button>
          </div>
          <div v-if="chainError" class="text-danger" style="margin-top: 0.5rem">
            Your network is not supported!
            <br />
            Switch to Ethereum, Scroll, Canto, or testnet to proceed.
            <br />
            <b-button variant="primary" size="md" @click="w3modalNetworks" style="margin-top: 0.5rem;">Select
              network</b-button>
          </div>
          <div v-for="(status, hash) in waitingHashes"
            style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; gap: 0.5rem;">
            <a href="#" style="width: 1rem; padding-bottom: 0.5rem; visibility: hidden">
              <b-icon-x />
            </a>
            <div v-if="status === null" class="text-center animated-underline">
              Waiting for
              <a :href="txLink(hash)" target="_blank">{{
                shortHash(hash)
              }}</a>
            </div>
            <span v-else-if="status === true" class="text-center text-success" style="padding-bottom: 0.5em;">
              Transaction confirmed
              <a :href="txLink(hash)" target="_blank">{{
                shortHash(hash)
              }}</a>
            </span>
            <div v-else-if="status === false" class="text-center text-danger" style="padding-bottom: 0.5em;">
              Transaction failed
              <a :href="txLink(hash)" target="_blank">{{
                shortHash(hash)
              }}</a>
            </div>
            <a href="#" style="width: 1rem; padding-bottom: 0.5rem; color: inherit;"
              @click.prevent="removeWaitingHash(hash)">
              <b-icon-x />
            </a>
          </div>
        </div>
      </div>
      <div id="flex-wrap"
        style="display: flex; gap: 0.5rem; flex-wrap: wrap; width: 100%; justify-content: center; margin-bottom: 0.5rem">
        <ExchangePositions v-if="address" class="main-panel border shadow-sm rounded" style="width: 100%; height: auto"
          :address="address" :surpluses="surpluses" :tokens="TOKENS[chainId]" :positions="positions" :pools="pools"
          :refreshing="refreshing" @refresh="refreshData" @withdraw="(a) => setWithdrawTarget(a, true)"
          @transfer="(a) => setWithdrawTarget(a, false)" @removeLp="setRemoveLp" />
        <!-- there were too many props ten props ago -->
        <ActionInput class="main-panel border shadow-sm rounded" style="height: auto; width: inherit" ref="actionInput"
          @perform="performAction" @fetchToken="a => fetchTokenInfo(a, true)"
          @fetchWalletBalance="a => fetchWalletBalance(a)" @approve="sendApproveTx"
          @fetchPool="pos => fetchMissingPool(pos, true)" @parseTx="parseTx" :fetchSwapOutput="fetchSwapOutput" :pools="pools"
          :tokens="TOKENS[chainId]" :coldTokens="COLD_TOKENS[chainId]" :surpluses="surpluses"
          :walletBalances="walletBalances" :allowances="allowances" :parsedTxs="parsedTxs" :address="address"
          :signing="signing" :canSign="canSign" :crocChain="CHAINS[chainId]" />
      </div>
      <!-- this should obviously be its own component but i'm too tired of dealing with Vue at this point -->
      <div ref="signedCmdsPanel" v-if="Object.keys(signed.options).length > 0" id="signed-cmds-panel"
        class="main-panel border shadow-sm rounded" style="margin: 0 auto 0.5rem auto;">
        <h4 class="text-center">Signed commands</h4>
        <b-form-group id="input-group-relayer" label="Signed command" label-for="input-selected-scmd">
          <b-form-select id="input-selected-scmd" v-model="signed.selected" size="sm" :options="signed.options"
            @change="estimateTips(signed.options.find(o => o.sig == signed.selected), true)" value-field="sig"
            required></b-form-select>
        </b-form-group>
        <div class="signed-command-wrapper" :set="scmd = signed.options.find(o => o.sig == signed.selected)">
          <b-form id="relayer-form" @submit="(event) => relayOrSend(event, scmd)">
            <!-- <b-form-group id="input-group-relayer" label="Relayer" label-for="input-relayer"
              description="Third party that will send the TX">
              <b-form-select id="input-relayer" v-model="cmd._action._selectedRelayer" :options="RELAYERS"
                required></b-form-select>
            </b-form-group> -->
            <b-form-group id="input-group-tip-token" v-if="!scmd._action._relayManually && !scmd._action.tip.amount"
              style="margin-bottom: 0">
              <label label-for="input-tip-token">Tip for gas with token <b-icon-question-circle id="tipTokenQuestion" />
                <b-tooltip target="tipTokenQuestion" triggers="hover">
                  Your exchange balance must have this amount after the transaction
                </b-tooltip></label>
              <div style="display: flex; gap: 0.4rem">
                <div style="flex: 2">
                  <b-form-select id="input-tip-token" v-model="scmd._action._selectedTipToken"
                    :options="scmd._action._tipEstimates" value-field="token" :state="tipValid(scmd)"
                    required></b-form-select>
                </div>
                <b-button variant="dark" @click="estimateTips(scmd, true)" style="flex: 1" title="Estimate gas cost">
                  <span v-if="scmd._action._gasPrice && !estimating">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                      viewBox="0 0 16 16">
                      <path d="M3 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5Z" />
                      <path
                        d="M1 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1 2 2v.5a.5.5 0 0 0 1 0V8h-.5a.5.5 0 0 1-.5-.5V4.375a.5.5 0 0 1 .5-.5h1.495c-.011-.476-.053-.894-.201-1.222a.97.97 0 0 0-.394-.458c-.184-.11-.464-.195-.9-.195a.5.5 0 0 1 0-1c.564 0 1.034.11 1.412.336.383.228.634.551.794.907.295.655.294 1.465.294 2.081v3.175a.5.5 0 0 1-.5.501H15v4.5a1.5 1.5 0 0 1-3 0V12a1 1 0 0 0-1-1v4h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V2Zm9 0a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v13h8V2Z" />
                    </svg>
                    {{ scmd._action._gasPrice }}
                  </span>
                  <b-icon-arrow-clockwise v-else :class="{ 'icon-spin': estimating }" />
                </b-button>
              </div>
              <small class="form-text text-muted text-center mb-2">Will be deducted from your exchange balance (or the
                command size will be reduced to ensure you have enough left)</small>
            </b-form-group>
            <div id="attached-tip" v-if="scmd._action.tip.amount" style="display: flex; align-items: center; gap: 0.5rem">
              <span style="height: fit-content">Attached tip: {{ this.tipAmountHuman(scmd._action.tip) }}</span>
              <b-button @click=removeTip(scmd) variant="light"><b-icon-trash /></b-button>
            </div>

            <div style="display: flex; justify-content: center;">
              <b-form-checkbox id="checkbox-relayManually" switch v-model="scmd._action._relayManually"
                name="checkbox-relayer" class="mb-2">
                Send manually
              </b-form-checkbox>
              <b-icon-question-circle id="relayManuallyQuestion" style="margin: 0.3rem 0 0 0.3rem" />
              <b-tooltip target="relayManuallyQuestion" triggers="hover">
                Send the TX from the connected address.<br /> You can connect any address right now, as long as it has ETH
                for gas.
              </b-tooltip>
            </div>
            <b-button ref="relayButton" :variant="relaying ? 'outline-success' : 'success'" size="lg" style="width: 100%"
              type=submit :disabled="relayButtonDisabled(scmd)">
              <div v-if="relaying" class="load-spinner spinner-border spinner-border-md" role="status">
                <span class="sr-only">{{ scmd._action._relayManually ? 'Sending...' : 'Relaying...' }}</span>
              </div>
              <div v-else>{{ relayButtonText(scmd) }}</div>
            </b-button>
          </b-form>
        </div>
      </div>
      <div id="footer" class="text-center">
        <div class="me">Made by <a href="https://busimus.eth.limo" target="_blank">bus</a></div>
        <div class="source">
          <a href="https://github.com/busimus/ars" target="_blank">Source code</a>
        </div>
      </div>
    </div>
    <b-modal ref="warning-modal" title="Warning" ok-only ok-title="I know what I'm doing" hide-header-close
      no-close-on-backdrop no-close-on-esc ok-variant="primary" @ok="termsAccepted" centered>
      <p><strong>Everything here is provided "as is", without warranty of any kind.</strong> </p>
      <p>This is an advanced UI that might lack some protections of the official Ambient app. </p>
    </b-modal>
  </div>
</template>

<script>

import {
  decodeCrocPrice,
  toDisplayPrice,
  poolKey,
  dump,
  shortHash,
  genSimilarPositions
} from "./utils.jsx";
import {
  BAvatar,
  BButton,
  BCollapse,
  BDropdown,
  BDropdownItem,
  BTooltip,
  BForm,
  BFormGroup,
  BFormSelect,
  BFormCheckbox,
  BModal,
  BIconX,
  BIconTrash,
  BIconChevronDown,
  BIconChevronUp,
  BIconArrowClockwise,
  BIconThreeDotsVertical,
  BIconQuestionCircle,
} from "bootstrap-vue";

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { configureChains, createConfig, getPublicClient, getWalletClient, fetchToken, fetchBalance } from '@wagmi/core'
import { mainnet, scroll, canto, goerli, sepolia, scrollSepolia } from '@wagmi/core/chains'
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

const chains = [mainnet, blast, scroll, canto, sepolia, blastSepolia, scrollSepolia, goerli ]
const projectId = '8978c906351c8a4e3eccd85a700306ab'

const wagmiConfig = defaultWagmiConfig({
  autoConnect: true,
  chains,
  projectId,
  metadata: {
    name: 'Ambient Relay Serivce',
    description: 'Alternative frontend for Ambient Finance',
    url: 'https://ars.bus.bz',
    icons: ['https://raw.githubusercontent.com/busimus/ars/main/frontend/src/assets/icon-512x512.png']
  }
})

import chain1 from './assets/chains/1.webp'
import chain5 from './assets/chains/5.webp'
import chain7700 from './assets/chains/7700.webp'
import chain81457 from './assets/chains/81457.webp'
import chain42161 from './assets/chains/42161.webp'
import chain421613 from './assets/chains/421613.webp'
import chain534351 from './assets/chains/534351.webp'
import chain534352 from './assets/chains/534352.webp'
import chain11155111 from './assets/chains/11155111.webp'
import chain168587773 from './assets/chains/168587773.webp'

const chainImages = {
  1: chain1,
  5: chain5,
  7700: chain7700,
  81457: chain81457,
  42161: chain42161,
  421613: chain421613,
  534351: chain534351,
  534352: chain534352,
  11155111: chain11155111,
  168587773: chain168587773,
}

const web3modal = createWeb3Modal({
  wagmiConfig, projectId, chains, themeMode: 'dark',
  chainImages
})

import { ethers, BigNumber } from "ethers";
import { roundForConcLiq, tickToPrice } from '@crocswap-libs/sdk'
import cloneDeep from 'lodash.clonedeep'
import * as Sentry from "@sentry/browser";

import { watchAccount, watchNetwork, signTypedData } from '@wagmi/core'
import { encodeAbiParameters, toHex, numberToHex, hexToBigInt, formatUnits, formatEther, UserRejectedRequestError, parseUnits, parseEther, encodeFunctionData, decodeFunctionData, decodeAbiParameters, recoverTypedDataAddress, signatureToHex, defineChain } from 'viem'
import { normalize } from 'viem/ens'
import { signERC2612Permit } from './permit.jsx'

import ExchangePositions from './components/ExchangePositions.vue'
import ActionInput from './components/ActionInput.vue'
import { GraphcacheProvider, GRAPHCACHE_PROVIDERS } from './graphcache_provider.js'
import { getFormattedNumber } from './number_formatting.jsx'
import { lpBaseTokens, lpQuoteTokens, getSomeTokenForChain, concPosSlot, ambientPosSlot } from './utils.jsx'
import { CROC_CHAINS } from './constants.js'
import { CROC_ABI } from './abis/croc.js'
import { QUERY_ABI } from './abis/query.js'
import { IMPACT_ABI } from './abis/impact.js'
import { MULTICALL_ABI } from './abis/multicall3.js'
import { COMMANDS, SETTLE_TO_DEX, BASE_TO_DEX, QUOTE_TO_DEX } from './dex_actions.jsx'
import { TOKENS } from './tokens.js'
import { OrderDirective } from './longform.jsx'

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const RELAYERS = {
  bus: {
    value: 'bus',
    text: "bus",
    endpoint: 'https://relayer.bus.bz/',
    acceptedTipTokens: {
      1: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", ZERO_ADDRESS, "0xdac17f958d2ee523a2206206994597c13d831ec7", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "0x6b175474e89094c44da98b954eedeac495271d0f"],
      5: ["0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", ZERO_ADDRESS, "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60", "0xc04b0d3107736c32e19f1c62b2af67be61d63a05"],
      11155111: ["0x60bba138a74c5e7326885de5090700626950d509", ZERO_ADDRESS, "0xca97cc9c1a1dfa54a252daafe9b5cd1e16c81328"],
      7700: ["0x80b5a32e4f032b2a058b4f29ec95eefeeb87adcd", ZERO_ADDRESS],
      81457: ["0x4300000000000000000000000000000000000003", ZERO_ADDRESS],
      42161: ["0xaf88d065e77c8cc2239327c5edb3a432268e5831", ZERO_ADDRESS, "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"],
      421613: ["0xc944b73fba33a773a4a07340333a3184a70af1ae", ZERO_ADDRESS, "0x5263e9d82352b8098cc811164c38915812bfc1e3", "0xc52f941486978a25fad837bb701d3025679780e4"],
      534351: ['0x4d65fb724ced0cfc6abfd03231c9cdc2c36a587b', ZERO_ADDRESS],
      534352: ["0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4", "0xf55bec9cafdbe8730f096aa55dad6d22d44099df", ZERO_ADDRESS],
      168587773: [ZERO_ADDRESS]
    }
  }
}

// approximate amount of gas that adding a tip costs (since it's not possible to estimate gas with a tip). it also depends on the token?
const RELAYER_GAS_TIP_MARKUP = 15000n

const REFRESH_PERIOD = 30000

// hot path swaps aren't supported for now
const LONG_PATH_SWAP = true


export default {
  name: "App",
  components: {
    BAvatar,
    BButton,
    BCollapse,
    BDropdown,
    BDropdownItem,
    BTooltip,
    BForm,
    BFormGroup,
    BFormSelect,
    BFormCheckbox,
    BModal,
    BIconX,
    BIconTrash,
    BIconChevronDown,
    BIconChevronUp,
    BIconArrowClockwise,
    BIconThreeDotsVertical,
    BIconQuestionCircle,
    ActionInput,
    ExchangePositions,
  },
  data: function () {
    const gc = new GraphcacheProvider(GRAPHCACHE_PROVIDERS[0])
    return {
      address: undefined,
      account: undefined,
      chainId: 1,
      chain: undefined,
      graphcache: gc,
      positions: {},
      surpluses: {},
      walletBalances: {},
      allowances: {},
      pools: {},
      signed: {
        selected: null,
        options: []
      },
      parsedTxs: {},
      accountWatch: null,
      networkWatch: null,
      signing: false,
      relaying: false,
      refreshing: 0,
      estimating: false,
      refreshTicker: null,
      waitingHashes: {},
      autoRefreshPaused: false,
      lastRefresh: 0,
      chainError: false,
      RELAYERS,
      TOKENS,
      shortHash,
      CHAINS: CROC_CHAINS,
      CHAIN_IMAGES: chainImages,
      COLD_TOKENS: { 1: {}, 5: {}, 7700: {}, 42161: {}, 81457: {}, 421613: {}, 534351: {}, 534352: {}, 168587773: {}, 11155111: {} },

      ethBalance: '',
      ensName: null,
      ensAvatar: null,
    };
  },
  methods: {
    w3modal: async function () {
      await web3modal.open()
    },
    w3modalNetworks: async function () {
      await web3modal.open({ view: 'Networks' })
    },
    accountChanged: function (account) {
      console.log('accountChanged', account)
      this.account = account
      this.address = (account.address || '').toLowerCase() || null
    },
    networkChanged: function (network) {
      console.log('networkChanged', network)
      this.chain = network
      if (network.chain) {
        this.resetData(true, true) // before chainId because some components depend on it
        if (chains.map((c) => c.id).includes(network.chain.id)) {
          this.chainError = false
          this.chainId = network.chain.id
          this.fetchTokens(this.chainId)
        } else {
          this.chainError = true
        }
        this.refreshData()
      } else {
        this.chainError = false
        this.resetData(true, true)
        this.chainid = 1
      }
    },
    setWithdrawTarget: function (tokenAddr, withdraw) {
      let action = cloneDeep({ ...COMMANDS.withdraw })
      if (!withdraw)
        action = cloneDeep({ ...COMMANDS.transfer })
      action.token = tokenAddr
      action.qty = this.surpluses[tokenAddr].string
      action._qtyRaw = this.surpluses[tokenAddr].raw
      action._qtyDecimals = this.surpluses[tokenAddr].decimals
      console.log('setting action', action)
      this.$refs.actionInput.setAction(action)
      this.$nextTick(() => {
        this.$refs.actionInput.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    setRemoveLp: function (positionId) {
      const pos = this.positions[positionId]
      let action = null
      if (pos.positionType == 'concentrated') {
        action = cloneDeep({ ...COMMANDS.removeConcLp })
        action.qty = pos.concLiq
        //action.qty = BigInt(pos.concLiq)
      } else {
        action = cloneDeep({ ...COMMANDS.removeAmbLp })
        action.qty = pos.ambientLiq
        //action.qty = BigInt(pos.ambientLiq)
      }
      if (pos.qty)
        action.qty = pos.qty

      action.base = pos.base
      action.quote = pos.quote
      action.poolIdx = pos.poolIdx
      action.bidTick = pos.bidTick
      action.askTick = pos.askTick
      action._baseDecimals = pos._baseDecimals
      action._quoteDecimals = pos._quoteDecimals
      console.log('setting action', action)
      this.$refs.actionInput.setAction(action)
      this.$nextTick(() => {
        this.$refs.actionInput.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    performAction: async function (actionInput) {
      console.log('performing', actionInput)
      console.log(dump(actionInput))
      this.signing = true;
      const action = cloneDeep({ ...actionInput })
      let cmd = null
      try {
        if (action._type == 'withdraw') {
          cmd = await this.buildWithdrawSurplusCmd(action, true)
        } else if (action._type == 'transfer') {
          cmd = this.buildWithdrawSurplusCmd(action, false)
        } else if (action._type == 'removeConcLp') {
          cmd = this.buildRemoveConcLpCmd(action)
        } else if (action._type == 'removeAmbLp') {
          cmd = this.buildRemoveAmbLpCmd(action)
        } else if (action._type == 'swap') {
          cmd = this.buildSwapCmd(action)
        } else if (action._type == 'deposit') {
          if (action._gasless) {
            action.permit = await this.getDepositPermit(action)
            cmd = this.buildDepositWithPermitCmd(action)
          } else {
            cmd = this.buildDepositCmd(action)
          }
        } else {
          throw "Can't perform this action"
        }

        if (action._gasless != true) {
          let hash;
          if (action._type != 'swap' || (action._gasless && LONG_PATH_SWAP))
            hash = await this.sendUserCmdTx(cmd)
          else
            hash = await this.sendSwapTx(cmd)
          console.log(hash)
          await this.waitForHash(hash)
        } else {
          const signedCmd = await this.signCmd(cmd)
          if (signedCmd) {
            this.signed.options.push(signedCmd)
            this.signed.selected = signedCmd.sig
            this.$nextTick(() => this.$refs.signedCmdsPanel.scrollIntoView({ behavior: 'smooth', block: 'end' }))
          }
        }
      } catch (e) {
        console.error('performAction error', e)
        // console.log(e.name)
        // console.log(e.message)
        // console.log(e.cause)
        // console.log(e.details)
        if (!(e.prototype instanceof UserRejectedRequestError) && !(e.name == 'UserRejectedRequestError') && (e.message && !e.message.startsWith('User rejected'))) {
          Sentry.captureException(e)
          this.showToast('Command exception', e.toString(), 'danger')
        } else if (typeof (e) == 'string') {
          this.showToast('Command exception', e, 'danger')
        }
      }
      this.signing = false
    },
    buildSwapCmd: function (action) {
      if (action._gasless && LONG_PATH_SWAP)
        return this.buildLongSwapCmd(action)
      console.log(action)
      const a = action._estimate.args
      const callpath = 1
      const cmd = encodeAbiParameters(
        [
          { name: 'base', type: 'address' },
          { name: 'quote', type: 'address' },
          { name: 'poolIdx', type: 'uint256' },
          { name: 'isBuy', type: 'bool' },
          { name: 'inBaseQty', type: 'bool' },
          { name: 'qty', type: 'uint128' },
          { name: 'tip', type: 'uint16' },
          { name: 'limitPrice', type: 'uint128' },
          { name: 'minOut', type: 'uint128' },
          { name: 'settleFlags', type: 'uint8' },
        ],
        [a.base, a.quote, a.poolIdx, a.isBuy, a.inBaseQty, a.qty,
        a.tip, a.limitPrice, action._estimate.minOut, action.settleFlags]
      )
      return { callpath, cmd, _action: action }
    },
    buildLongSwapCmd: function (action) {
      console.log('long', action)
      const a = action._estimate.args
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.long

      console.log('opening order', action._fromToken)
      const order = new OrderDirective(action._fromToken)
      order.open.useSurplus = true

      console.log('opening hop', action._toToken)
      const hop = order.appendHop(action._toToken)
      hop.settlement.useSurplus = false
      const pool = order.appendPool(a.poolIdx)
      pool.swap.isBuy = a.isBuy
      pool.swap.inBaseQty = a.inBaseQty
      pool.swap.qty = a.qty
      pool.swap.limitPrice = a.limitPrice

      pool.chain.rollExit = true
      pool.chain.rollType = 0

      const cmd = toHex(order.encodeBytes())
      console.log(cmd)

      return { callpath, cmd, _action: action }
    },
    buildRemoveConcLpCmd: function (action) {
      console.log(action)
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.liq
      const qty = roundForConcLiq(BigNumber.from(BigInt(action.qty) * BigInt(action._qtyPct) / 100n))
      const cmd = encodeAbiParameters(
        [
          { name: 'code', type: 'uint8' },
          { name: 'base', type: 'address' },
          { name: 'quote', type: 'address' },
          { name: 'poolIdx', type: 'uint256' },
          { name: 'bidTick', type: 'int24' },
          { name: 'askTick', type: 'int24' },
          { name: 'qty', type: 'uint128' },
          { name: 'limitLower', type: 'uint128' },
          { name: 'limitHigher', type: 'uint128' },
          { name: 'settleFlags', type: 'uint8' },
          { name: 'lpConduit', type: 'address' }
        ],
        [2, action.base, action.quote, action.poolIdx, action.bidTick, action.askTick, qty,
          action.limitLower, action.limitHigher, action.settleFlags, ZERO_ADDRESS]
      )
      return { callpath, cmd, _action: action }
    },
    buildRemoveAmbLpCmd: function (action) {
      console.log(action)
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.liq
      const WITHDRAW_ALL = 0xffffffffffffffffffffffffffffffffn // from ambient-ts-app
      let qty = action._qtyPct == 100 ? WITHDRAW_ALL : BigNumber.from(BigInt(action.qty) * BigInt(action._qtyPct) / 100n)
      console.log(qty)

      const cmd = encodeAbiParameters(
        [
          { name: 'code', type: 'uint8' },
          { name: 'base', type: 'address' },
          { name: 'quote', type: 'address' },
          { name: 'poolIdx', type: 'uint256' },
          { name: 'bidTick', type: 'int24' },
          { name: 'askTick', type: 'int24' },
          { name: 'qty', type: 'uint128' },
          { name: 'limitLower', type: 'uint128' },
          { name: 'limitHigher', type: 'uint128' },
          { name: 'settleFlags', type: 'uint8' },
          { name: 'lpConduit', type: 'address' }
        ],
        [4, action.base, action.quote, action.poolIdx, 0, 0, qty, action.limitLower, action.limitHigher, action.settleFlags, ZERO_ADDRESS]
      )
      return { callpath, cmd, _action: action }
    },
    buildWithdrawSurplusCmd: function (action, withdraw = true) {
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.cold
      const cmd = encodeAbiParameters(
        [
          { name: 'code', type: 'uint8' },
          { name: 'recv', type: 'address' },
          { name: 'qty', type: 'uint128' },
          { name: 'token', type: 'address' }
        ],
        [withdraw ? 74n : 75n, action.recv, action._qtyRaw, action.token]
      )
      return { callpath, cmd, _action: action }
    },
    buildMintLimitCmd: function (action) {
      const a = action
      const callpath = 7
      const limitArgs = encodeAbiParameters(
        [
          { name: 'qty', type: 'uint128' },
          { name: 'insideMid', type: 'bool' },
        ],
        [a._qtyRaw, false]
      )
      const cmd = encodeAbiParameters(
        [
          { name: 'code', type: 'uint8' },
          { name: 'base', type: 'address' },
          { name: 'quote', type: 'address' },
          { name: 'poolIdx', type: 'uint256' },
          { name: 'lowTick', type: 'int24' },
          { name: 'highTick', type: 'int24' },
          { name: 'isBid', type: 'bool' },
          { name: 'settleFlags', type: 'uint8' },
          { name: 'args', type: 'bytes' },
        ],
        [91, a.base, a.quote, a.poolIdx, a.lowTick, a.highTick, a.isBid,
          a.settleFlags, limitArgs]
      )
      return { callpath, cmd, _action: action, value: action.isBid && action.base == ZERO_ADDRESS ? action._qtyRaw : 0n }
    },
    multiLimitMint: async function (action) {
      // const action1 = { base: "0x0000000000000000000000000000000000000000", quote: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", poolIdx: 420n, lowTick: 0x2fea0, highTick: 0x2feb0, isBid: true, _qtyRaw: 4000000000000n, settleFlags: 4 }
      // const cmd1 = this.buildMintLimitCmd(action1)
      // const action2 = { base: "0x0000000000000000000000000000000000000000", quote: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", poolIdx: 420n, lowTick: 0x2eea0, highTick: 0x2eea4, isBid: true, _qtyRaw: 4000000000000n, settleFlags: 4 }
      // const cmd2 = this.buildMintLimitCmd(action2)
      const action1 = {base: "0x0000000000000000000000000000000000000000", quote: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4", poolIdx: 420n, lowTick: 0x30e74, highTick: 0x30e78, isBid: false, _qtyRaw: 1000000n, settleFlags: 0}
      const cmd1 = this.buildMintLimitCmd(action1)
      const action2 = {base: "0x0000000000000000000000000000000000000000", quote: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4", poolIdx: 420n, lowTick: 0x31e74, highTick: 0x31e78, isBid: false, _qtyRaw: 1000000n, settleFlags: 0}
      const cmd2 = this.buildMintLimitCmd(action2)
      await this.sendMultiUserCmd([cmd1, cmd2])
      return cmd2
    },
    getDepositPermit: async function (action) {
      const wallet = await getWalletClient({ chainId: this.chainId })
      const client = getPublicClient()
      const permit = await signERC2612Permit(client, wallet, action.token, this.address, CROC_CHAINS[this.chainId].addrs.dex, this.chainId, action._qtyRaw)
      console.log('permit', permit)
      return permit
    },
    sendApproveTx: async function (tokenAddr, qty) {
      this.signing = true
      if (tokenAddr == ZERO_ADDRESS)
        return
      const call = {
        address: tokenAddr, abi: [{ "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "deprecated", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }],
        functionName: "approve", args: [CROC_CHAINS[this.chainId].addrs.dex, qty],
        account: this.account
      }
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract(call)
        console.log('sim', sim)
        const wallet = await getWalletClient({ chainId: this.chainId })
        const hash = await wallet.writeContract(sim.request)
        await this.waitForHash(hash)
      } catch (e) {
        console.error('sendApproveTx error', e)
        // this.showToast('Send TX error', e.toString(), 'danger')
        // throw e
      }
      this.signing = false
    },
    buildDepositCmd: function (action) {
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.cold

      const cmd = encodeAbiParameters(
        [
          { name: 'cmd', type: 'uint8' },
          { name: 'recv', type: 'address' },
          { name: 'value', type: 'uint128' },
          { name: 'token', type: 'address' },
        ],
        [73, action.recv, action._qtyRaw, action.token]
      )
      return { callpath, cmd, _action: action, value: action.token == ZERO_ADDRESS ? action._qtyRaw : 0n }
    },
    buildDepositWithPermitCmd: function (action) {
      const callpath = CROC_CHAINS[this.chainId].proxyPaths.cold

      // console.log([83, action.recv, action._qtyRaw, action.token, action.permit.deadline,
      //   action.permit.v, action.permit.r, action.permit.s])
      const cmd = encodeAbiParameters(
        [
          { name: 'cmd', type: 'uint8' },
          { name: 'recv', type: 'address' },
          { name: 'value', type: 'uint128' },
          { name: 'token', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'v', type: 'uint8' },
          { name: 'r', type: 'bytes32' },
          { name: 's', type: 'bytes32' },
        ],
        [83, action.recv, action._qtyRaw, action.token, action.permit.deadline,
          action.permit.v, action.permit.r, action.permit.s]
      )
      return { callpath, cmd, _action: action }
    },
    signCmd: async function (cmd, noTips=false) {
      console.log('signCmd', cmd)
      try {
        const nonce = 0
        console.log('nonce', nonce)
        const salt = toHex(ethers.utils.randomBytes(32))
        // const salt = keccak256(this.address + 'ASR') // salting the salt to not collide with anyone else who's also using deterministic salt
        const relayer = cmd._action._relayerAddr ? cmd._action._relayerAddr : ZERO_ADDRESS
        const deadline = BigInt(parseInt(Date.now() / 1000) + 24 * 60 * 60)

        const conds = encodeAbiParameters(
          [
            { name: 'deadline', type: 'uint48' },
            { name: 'alive', type: 'uint48' },
            { name: 'salt', type: 'bytes32' },
            { name: 'nonce', type: 'uint32' },
            { name: 'relayer', type: 'address' }
          ],
          // [281474976710655n, 0, salt, nonce, relayer]
          [deadline, 0, salt, nonce, relayer]
        )
        console.log(conds)
        // const TIP_ALL = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
        let tip = '0x'
        if (cmd._action.tip && cmd._action.tip.amount) {
          tip = encodeAbiParameters(
            [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint128' },
              { name: 'recv', type: 'address' },
            ],
            [cmd._action.tip.token, cmd._action.tip.amount, numberToHex(256, { size: 20 })])
        }


        const rawSig = (await this.signData(cmd.callpath, cmd.cmd, conds, tip))
        // naive substring split breaks with some wallet combinations
        const spl = ethers.utils.splitSignature(rawSig)

        const sig = encodeAbiParameters(
          [
            { name: 'v', type: 'uint8' },
            { name: 'r', type: 'uint256' },
            { name: 's', type: 'uint256' },
          ],
          [spl.v, spl.r, spl.s]
        )
        console.log('sig', sig)

        const signedCmd = {
          callpath: cmd.callpath, cmd: cmd.cmd,
          conds, sig, nonce, salt, tip,
          text: cmd._action._description, _action: cmd._action
        }
        console.log('signedCmd', signedCmd)
        try {
          if (cmd._action._selectedTipToken == null && !noTips)
            await this.estimateTips(signedCmd)
          const sim = await this.sendRelayerTx(signedCmd, true)
        } catch (e) {
          // console.error('tip or sim error', e)
          throw e
        }

        return signedCmd
      } catch (e) {
        // console.error('signCmd exception', e)
        // this.showToast('Signing exception', e.toString(), 'danger')
        throw e
      }
    },
    sendMultiUserCmd: async function (cmds) {
      console.log('sendMultiUserCmdTx', cmds)
      let calls = []
      let totalValue = 0n
      // cmds = [cmds[0]]
      for (const cmd of cmds) {
        const scmd = await this.signCmd(cmd, true)
        const encodedCmd = encodeFunctionData({
          functionName: 'userCmdRelayer', args: [scmd.callpath, scmd.cmd, scmd.conds, scmd.tip, scmd.sig], value: cmd.value,
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI
        })
        calls.push({
          target: CROC_CHAINS[this.chainId].addrs.dex,
          allowFailure: false, // @TODO: configurable?
          value: cmd.value,
          callData: encodedCmd
        })
        totalValue += cmd.value
      }
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract({
          functionName: 'aggregate3Value', args: [calls], value: totalValue,
          address: CROC_CHAINS[this.chainId].addrs.multicall3, abi: MULTICALL_ABI,
          account: this.account
        })
        console.log('sim', sim)
        const wallet = await getWalletClient({ chainId: this.chainId })
        return await wallet.writeContract(sim.request)
      } catch (e) {
        console.error('sendUserTx error', e)
        // this.showToast('Send TX error', e.toString(), 'danger')
        throw e
      }
    },
    sendUserCmdTx: async function (cmd) {
      console.log('sendUserCmdTx', cmd)
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract({
          functionName: 'userCmd', args: [cmd.callpath, cmd.cmd], value: cmd.value,
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: this.account
        })
        console.log('sim', sim)
        const wallet = await getWalletClient({ chainId: this.chainId })
        return await wallet.writeContract(sim.request)
      } catch (e) {
        console.error('sendUserTx error', e)
        // this.showToast('Send TX error', e.toString(), 'danger')
        throw e
      }
    },
    sendRelayerTx: async function (cmd, simOnly = false) {
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract({
          functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: ZERO_ADDRESS,
        })
        console.log('sim', sim)
        if (simOnly)
          return sim
        const wallet = await getWalletClient({ chainId: this.chainId })
        sim.request.account = this.address
        return await wallet.writeContract(sim.request)
      } catch (e) {
        console.error('sendRelayerTx error', e)
        // if (!simOnly)
        //   this.showToast('Send relayer TX error', e.toString(), 'danger')
        throw e
      }
    },
    sendSwapTx: async function (cmd) {
      console.log('sendSwapTx', cmd)
      const action = cmd._action;
      const a = action._estimate.args;
      const args = [a.base, a.quote, a.poolIdx, a.isBuy, a.inBaseQty, a.qty,
      a.tip, a.limitPrice, action._estimate.minOut, action.settleFlags];
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract({
          functionName: 'swap', args: args,
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: this.account
        })
        console.log('sim', sim)
        const wallet = await getWalletClient({ chainId: this.chainId })
        return await wallet.writeContract(sim.request)
      } catch (e) {
        console.error('sendUserTx error', e)
        // this.showToast('Send TX error', e.toString(), 'danger')
        throw e
      }
    },
    relayOrSend: async function (event, scmd) {
      event.preventDefault()
      this.relaying = true
      try {
        if (scmd._action._relayManually == true) {
          const hash = await this.sendRelayerTx(scmd)
          await this.waitForHash(hash, null, scmd.sig)
        } else {
          const tipToken = scmd._action._selectedTipToken
          const clonedScmd = cloneDeep(scmd)
          clonedScmd._action.tip = { token: tipToken, amount: scmd._action._tipEstimates[tipToken].amount }
          console.log("relaying!", dump(clonedScmd))
          try {
            this.ensureBalance(clonedScmd)
          } catch (e) {
            console.error('ensure error', e)
            this.showToast("Tip error", e.toString(), "danger")
            throw e
          }
          const resignedCmd = await this.signCmd(clonedScmd)
          const hash = await this.relay(resignedCmd)
          console.log('got hash', hash)
          await this.waitForHash(hash, RELAYERS[scmd._action._selectedRelayer].endpoint, scmd.sig)
        }
      } catch (e) {
        console.error('relayOrSend error', e)
      }
      this.relaying = false
    },
    // Checks whether balance has enough for the tip and modifies scmd if needed, throws an error otherwise
    ensureBalance: function (scmd) {
      const tip = scmd._action.tip;
      const a = scmd._action;
      const tipTokenBalance = this.surpluses[tip.token] ? this.surpluses[tip.token].raw : 0n
      console.log('scmd', scmd)
      // console.log('tip', tip, tipTokenBalance)
      // console.log(this.surpluses)

      // If withdrawing/transfering the tip token adjust withdrawan amount if needed
      if ((a._type == 'withdraw' || a._type == 'transfer') && a.token == tip.token) {
        const remainder = BigInt(tipTokenBalance) - BigInt(a._qtyRaw)
        if (remainder >= tip.amount) {
          return true
        } else if (remainder < tip.amount && tipTokenBalance > tip.amount) {
          console.log('lowering withdraw amount')
          a._qtyRaw = BigInt(a._qtyRaw) - (BigInt(tip.amount) - remainder)
          console.log('cmd before', scmd.cmd)
          const { cmd } = this.buildWithdrawSurplusCmd(a, a._type == 'withdraw')
          scmd.cmd = cmd
          console.log('cmd after', scmd.cmd)
          return true
        } else {
          throw "Not enough DEX balance to cover the tip"
        }
      }

      // if swapping to tipped token and settling it to DEX
      if (a._type == 'swap' && a._toToken == tip.token && (a._estimate.result + tipTokenBalance) >= tip.amount) {
        console.log('swap to tip', scmd)
        if (scmd._action.settleFlags == SETTLE_TO_DEX) {
          return true
        } else if (scmd._action.settleFlags == BASE_TO_DEX && a._toToken == a._estimate.args.base) {
          return true
        } else if (scmd._action.settleFlags == QUOTE_TO_DEX && a._toToken == a._estimate.args.quote) {
          return true
        }
      }

      // if swapping from tipped token
      if (a._type == 'swap' && a._fromToken == tip.token) {
        const remainder = BigInt(tipTokenBalance) - BigInt(a._fromQtyRaw)
        if (remainder >= tip.amount) {
          return true
        } else if (remainder < tip.amount && tipTokenBalance > tip.amount) {
          console.log('lowering swap amount')
          const fromToken = this.TOKENS[this.chainId][a._fromToken].decimals
          const toToken = this.TOKENS[this.chainId][a._toToken].decimals
          const fromFloat = parseFloat(a._fromQty)
          const remainderFloat = parseFloat(formatUnits(BigInt(tip.amount) - BigInt(remainder), fromToken.decimals))
          const percentageReduction = remainderFloat / fromFloat

          console.log('before', a._estimate.args.qty)
          let lowerFromQtyRaw = BigInt(a._fromQtyRaw) - (BigInt(tip.amount) - remainder)
          a._estimate.args.qty = lowerFromQtyRaw
          a._fromQtyRaw = lowerFromQtyRaw
          a._fromQty = formatUnits(lowerFromQtyRaw, fromToken.decimals)
          console.log('after', a._estimate.args.qty)

          let toFloat = formatUnits(a._estimate.minOut, toToken.decimals)
          toFloat = toFloat - toFloat * percentageReduction // should work?
          const lowerToQtyRaw = parseUnits(toFloat.toString(), toToken.decimals)
          a._estimate.minOut = lowerToQtyRaw

          console.log('cmd before', scmd.cmd)
          const { cmd } = this.buildSwapCmd(a)
          scmd.cmd = cmd
          console.log('cmd after', scmd.cmd)
          return true
        } else {
          throw "Not enough DEX balance to cover the tip"
        }
      }

      // If not withdrawing/swapping and have enough balance
      if (tipTokenBalance >= BigInt(tip.amount)) {
        return true
      }

      // if depositing the tip token
      if (a._type == 'deposit' && a.token == tip.token && a._qtyRaw >= tip.amount) {
        return true
      }

      // If don't have enough balance and removing a tip token
      if ((a._type == 'removeConcLp' || a._type == 'removeAmbLp') && (a.base == tip.token || a.quote == tip.token)) {
        const pool = this.pools[poolKey(a)]
        const removedBase = lpBaseTokens(a, pool, a._qtyPct, false)
        const removedQuote = lpQuoteTokens(a, pool, a._qtyPct, false)
        const baseRatio = parseInt((removedBase * 10000n) / BigInt(tip.amount)) / 10000
        const quoteRatio = parseInt((removedQuote * 10000n) / BigInt(tip.amount)) / 10000
        // If settling to dex estimate whether the removed amount is enough.
        // The removed LP must be at least 2% larger than tip.
        const minRatio = 1.02
        if (a.settleFlags == SETTLE_TO_DEX || (a.settleFlags == BASE_TO_DEX && a.base == tip.token) || (a.settleFlags == QUOTE_TO_DEX && a.quote == tip.token)) {
          if ((a.base == tip.token && baseRatio > minRatio) || (a.quote == tip.token && quoteRatio > minRatio)) {
            return true
          }
        }
      }

      throw "Not enough DEX balance to cover the tip"
    },
    // validates that the selected or specified tip will work
    tipValid: function (scmd, overrideTipToken = null) {
      // console.log('tipValid', scmd)
      try {
        const tipToken = overrideTipToken ? overrideTipToken : scmd._action._selectedTipToken
        const clonedScmd = cloneDeep(scmd)
        clonedScmd._action.tip = { token: tipToken, amount: scmd._action._tipEstimates[tipToken].amount }
        return this.ensureBalance(clonedScmd)
      } catch (e) {
        return false
      }
    },
    // sends signedCmd to relayer and returns TX hash if successful
    relay: async function (scmd) {
      console.log("sending to relay", dump(scmd))
      const strippedCmd = { chainId: this.chainId, callpath: scmd.callpath, cmd: scmd.cmd, conds: scmd.conds, tip: scmd.tip, sig: scmd.sig }
      console.log('strippedCmd', strippedCmd)
      const relayer = RELAYERS[scmd._action._selectedRelayer]
      const url = new URL(relayer.endpoint)
      url.pathname = '/relay'
      let resp = null
      try {
        const response = await fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: JSON.stringify(strippedCmd),
        });
        resp = await response.json()
        console.log('relay resp', resp)
        if (!resp.success) {
          this.showToast("Relay error", resp.reason, "danger")
          return null
        }
      } catch (e) {
        this.showToast("Relay exception", e.toString(), "danger")
        Sentry.captureException(e);
        throw e
      }
      this.showToast("Relay success", 'Waiting for the transaction to confirm', "success")
      return resp ? resp.hash : null;
    },
    // calculates minimum tip amounts of acceptable tip tokens and sets action._tipEstimates
    // handleError shows a toast instead of throwing
    estimateTips: async function (signedCmd, handleError = false) {
      if (this.estimating)
        return
      this.estimating = true
      const tipOptions = {}
      try {
        const relayer = RELAYERS[signedCmd._action._selectedRelayer]
        const tipTokens = relayer.acceptedTipTokens[this.chainId]
        const { gas, additionalFee } = await this.estimateRelayerGas(signedCmd)
        const client = getPublicClient()
        // const gasPrice = 1000000000000n
        let gasPrice = await client.getGasPrice()
        if (this.chainId == goerli.id && gasPrice < parseEther('2', 'gwei')) // low gas on goerli breaks tip estimation
          gasPrice = parseEther('2', 'gwei')

        console.log('gasPrice', gasPrice)
        signedCmd._action._gasPrice = `${Math.ceil(parseInt(gasPrice) / 1000000000)} gwei`
        let gasInWei = gas * gasPrice + additionalFee
        console.log('gasInWei', gasInWei)
        const gasInETH = formatEther(gasInWei)

        if (tipTokens.indexOf(ZERO_ADDRESS) != -1) {
          let symbol = this.chain.chain.nativeCurrency.symbol
          if (this.chain.chain.testnet)
            symbol = 'g' + symbol
          tipOptions[ZERO_ADDRESS] = { token: ZERO_ADDRESS, text: `${parseFloat(gasInETH).toFixed(6)} ${symbol}`, amount: gasInWei.toString() }
        }

        const prices = await this.getPrices(tipTokens, ZERO_ADDRESS)
        // console.log('gotPrices', prices)

        for (const tokenAddress of tipTokens) {
          if (tokenAddress == ZERO_ADDRESS)
            continue
          let token;
          let amount = null
          try {
            token = await this.fetchTokenInfo(tokenAddress, true)
            let price = prices[tokenAddress]
            if (!price) {
              console.log('got bad price', price)
              throw 'got bad price'
            }
            amount = BigInt(Math.round(parseInt(gasInWei) / price))
          } catch (e) {
            console.error('getPrice error', e)
            continue
          }
          let amountHuman = getFormattedNumber(parseFloat(formatUnits(amount, token.decimals)))
          tipOptions[tokenAddress] = { token: tokenAddress, text: `${amountHuman} ${token.symbol}`, amount: amount.toString() }
        }
        console.log('tipOptions', tipOptions)
        signedCmd._action._tipEstimates = tipOptions
        if (!signedCmd._action._selectedTipToken) {
          signedCmd._action._selectedTipToken = tipTokens[0]
        }
        if (!signedCmd._action._tipEstimates.hasOwnProperty(signedCmd._action._selectedTipToken)) {
          signedCmd._action._selectedTipToken = ZERO_ADDRESS
        }

        // find the first valid tip token and select it if the default isn't valid
        let firstValid = null
        for (const tipToken of Object.keys(signedCmd._action._tipEstimates)) {
          const valid = this.tipValid(signedCmd, tipToken)
          if (valid) {
            firstValid = tipToken
            break
          }
        }
        if (!this.tipValid(signedCmd) && firstValid)
          signedCmd._action._selectedTipToken = firstValid
      } catch (e) {
        this.estimating = false
        if (handleError) {
          console.error('estimateTips error', e)
          this.showToast("Tip estimation error", e.toString(), "danger")
        } else {
          throw e
        }
      }
      this.estimating = false
    },
    // return onchain decoded price of assets relative to some other asset, assuming a pool exists
    getPrices: async function (pricesOf, relativeTo) {
      const poolQueries = []
      for (const priceOf of pricesOf) {
        if (priceOf == ZERO_ADDRESS)
          continue
        const invert = hexToBigInt(priceOf) < hexToBigInt(relativeTo)
        poolQueries.push({ base: invert ? priceOf : relativeTo, quote: invert ? relativeTo : priceOf, poolIdx: CROC_CHAINS[this.chainId].poolIndex, _priceOf: priceOf })
      }
      await this.fetchPools(poolQueries, true)
      const prices = {}
      for (const poolQ of poolQueries) {
        const pool = this.pools[poolKey(poolQ)]
        if (!pool || !pool.priceDecoded || pool.priceDecoded == 0) {
          console.warn(`Couldn't fetch price for ${poolQ._priceOf}`)
          continue
        }
        prices[poolQ._priceOf] = pool.priceDecoded
      }
      return prices
    },
    estimateRelayerGas: async function (cmd) {
      let additionalFee = 0n
      try {
        const client = getPublicClient()
        let gas = await client.estimateContractGas({
          functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: ZERO_ADDRESS
          // account: this.account
        })
        if (cmd.tip == '0x')
          gas += RELAYER_GAS_TIP_MARKUP
        // L1 fee for scroll
        if ([scroll.id, scrollSepolia.id].indexOf(this.chainId) != -1) {
          const calldata = encodeFunctionData({
            functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig], abi: CROC_ABI,
          })
          // lower because it doesn't have a tip. just bump it 30% for now, will fix it later
          const call = {
            address: '0x5300000000000000000000000000000000000002', abi: [{ "inputs": [{ "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "getL1Fee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
            functionName: "getL1Fee", args: [calldata]
          }
          additionalFee = (await client.readContract(call)) * 120n / 100n
        }
        // L1 fee for scroll
        else if ([blast.id, blastSepolia.id].indexOf(this.chainId) != -1) {
          const calldata = encodeFunctionData({
            functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig], abi: CROC_ABI,
          })
          // lower because it doesn't have a tip. just bump it 30% for now, will fix it later
          const call = {
            address: '0x420000000000000000000000000000000000000F', abi: [{ "inputs": [{ "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "getL1Fee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
            functionName: "getL1Fee", args: [calldata]
          }
          additionalFee = (await client.readContract(call)) * 130n / 100n
        }
        console.log('gas', gas, additionalFee)
        return { gas, additionalFee }
      } catch (e) {
        // console.error('sendRelayerTx error', e)
        throw e
      }
    },
    getTypedMessageArgs: function (callpath, cmd, conds, tip, chainId = null) {
      chainId = chainId || this.chainId
      const domain = {
        name: "CrocSwap",
        chainId: chainId,
        verifyingContract: CROC_CHAINS[chainId].addrs.dex
      }

      if ([5].indexOf(chainId) == -1)
        domain.version = '1.0'

      const types = {
        CrocRelayerCall: [
          { name: "callpath", type: "uint8" },
          { name: "cmd", type: "bytes" },
          { name: "conds", type: "bytes" },
          { name: "tip", type: "bytes" }
        ]
      }

      const message = { callpath, cmd, conds, tip }
      return { domain, types, message, primaryType: 'CrocRelayerCall' }

    },
    signData: async function (callpath, cmd, conds, tip) {
      const signature = await signTypedData(this.getTypedMessageArgs(callpath, cmd, conds, tip))
      return signature
    },
    // refresh all data for the current address
    refreshData: async function () {
      if (this.refreshing > 0)
        return
      console.log('refreshing data', this.address, this.chainId)
      if (!this.address || !this.chainId)
        return
      this.refreshing += 1
      const refreshables = [this.fetchUserInfo(), this.fetchPositions(this.address), this.fetchSurpluses(this.address, []),]
      // const refreshables = [await this.fetchSurpluses(this.address, []),]
      if (this.signed.selected) {
        refreshables.push(this.estimateTips(this.signed.options.find(o => o.sig == this.signed.selected)))
      }

      const walletTokens = Object.keys(this.allowances)
      if (walletTokens.indexOf(ZERO_ADDRESS) == -1)
        walletTokens.unshift(ZERO_ADDRESS)
      if (this.chainId == mainnet.id && walletTokens.indexOf("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") == -1)
        walletTokens.push("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
      if (this.chainId == goerli.id && walletTokens.indexOf("0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c") == -1)
        walletTokens.push("0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c")
      if (this.chainId == blast.id && walletTokens.indexOf("0x4300000000000000000000000000000000000003") == -1)
        walletTokens.push("0x4300000000000000000000000000000000000003")
      // i'm tired of writing multicalls, let batching do the work for once
      for (const token of walletTokens)
        refreshables.push(this.fetchWalletBalance(token)) // will fetch allowance too

      if (this.$refs.actionInput) // ????
        refreshables.push(this.$refs.actionInput.refreshSwap())

      try {
        await Promise.allSettled(refreshables)
      } catch (e) {
        console.error("refreshData error", e)
      }
      this.lastRefresh = Date.now()
      this.refreshing -= 1
    },
    resetData: function (pools = false, positions = false) {
      if (this.$refs.actionInput) // ????
        this.$refs.actionInput.resetAction()
      this.surpluses = {}
      this.walletBalances = {}
      this.allowances = {}
      this.parsedTxs = {}
      this.ensName = null
      this.ensAvatar = null
      this.ethBalance = null
      if (pools)
        this.pools = {}
      if (positions)
        this.positions = {}
    },
    fetchPositions: async function (owner) {
      const positions = cloneDeep(this.positions)
      try {
        const resp = await this.graphcache.user_positions(owner, numberToHex(this.chainId))
        console.log('positions resp', resp)
        for (const pos of resp) {
          // Indexer might return zeroes as liq values, they should be fetched from the contract anyway
          // if (pos.ambientLiq == 0 && pos.concLiq == 0 && pos.rewardLiq == 0) {
          //   continue
          // }
          try {
            const base = await this.fetchTokenInfo(pos.base)
            const quote = await this.fetchTokenInfo(pos.quote)
            pos._baseDecimals = base.decimals
            pos._quoteDecimals = quote.decimals
            pos.chainId = Number.parseInt(pos.chainId)
          } catch (e) {
            pos._baseDecimals = 18
            pos._quoteDecimals = 18
          }
          if (pos.positionType == 'concentrated')
            pos.slot = concPosSlot(this.address, pos.base, pos.quote, pos.bidTick, pos.askTick, pos.poolIdx).toString()
          else
            pos.slot = ambientPosSlot(this.address, pos.base, pos.quote, pos.poolIdx).toString()
          positions[pos.slot] = pos
        }
      } catch (e) {
        console.error('fetchPositions error', e)
      }
      try {
        await Promise.all([this.fetchPositionsLiq(positions), this.fetchPools(positions)])
      } catch (e) {
        console.error('fetchPositions liq error', e)
      }
      for (const [slot, pos] of Object.entries(positions)) {
        if (pos.qty)
          this.$set(this.positions, slot, pos)
        else
          this.$delete(this.positions, slot)
      }
      console.log('positions', dump(this.positions))
    },
    // fetches and updates pos.qty from the chain
    fetchPositionsLiq: async function (positions) {
      if (Object.keys(positions).length == 0)
        return
      let chainId = Object.values(positions)[0].chainId || this.chainId
      const client = getPublicClient({ chainId })
      const qContract = {
        address: CROC_CHAINS[chainId].addrs.query,
        abi: QUERY_ABI
      }

      const posIds = Object.keys(positions)
      const calls = posIds.map((posId) => {
        const pos = positions[posId]
        if (pos.positionType == 'concentrated')
          return { functionName: "queryRangeTokens", args: [pos.user, pos.base, pos.quote, pos.poolIdx, pos.bidTick, pos.askTick], ...qContract }
        else
          return { functionName: "queryAmbientTokens", args: [pos.user, pos.base, pos.quote, pos.poolIdx], ...qContract }
      })
      const reads = await client.multicall({ contracts: calls })
      console.log('fetchPositionsLiq query', positions)
      console.log('fetchPositionsLiq result', reads)
      for (const i in posIds) {
        const posId = posIds[i]
        const read = reads[i]
        if (read.status != "success") {
          console.error('pos liq fetch failure', positions[posId])
          continue
        }
        const pos = positions[posId]
        pos.qty = read.result[0]
        // pos.baseQty = reads[1]
        // pos.quoteQty = reads[2]
      }
    },
    fetchPools: async function (positions, ignoreErrors = false) {
      if (Object.keys(positions).length == 0)
        return
      let chainId = Object.values(positions)[0].chainId || this.chainId
      const client = getPublicClient({ chainId })
      const qContract = {
        address: CROC_CHAINS[chainId].addrs.query,
        abi: QUERY_ABI, functionName: "queryPrice",
      }

      const pools = {}
      for (const pos of Object.values(positions)) {
        pools[poolKey(pos)] = { base: pos.base, quote: pos.quote, poolIdx: pos.poolIdx }
      }

      const poolIds = Object.keys(pools)
      const calls = poolIds.map((id) => { return { args: [pools[id].base, pools[id].quote, pools[id].poolIdx], ...qContract } })
      const reads = await client.multicall({ contracts: calls })
      const fetchedPools = {}
      for (const i in poolIds) {
        const pool = pools[poolIds[i]]
        // console.log('fetched pool', poolIds[i], pool, reads[i])
        if (reads[i].status != "success" || reads[i].result == 0n) {
          console.error('pool fetch failure', poolIds[i])
          if (!ignoreErrors)
            throw 'Pool fetch failure'
          else {
            continue
          }
        }
        const price = reads[i].result
        pool.priceRaw = price
        const decoded = decodeCrocPrice(price)
        pool.priceDecoded = decoded
        const baseToken = await this.fetchTokenInfo(pool.base, false, chainId)
        const quoteToken = await this.fetchTokenInfo(pool.quote, false, chainId)
        pool.price = toDisplayPrice(decoded, baseToken.decimals, quoteToken.decimals, true)
        fetchedPools[poolIds[i]] = pool
      }
      console.log('pools', dump(pools))
      // this.pools = Object.assign({}, this.pools, fetchedPools)
      // Object.assign(this.pools, fetchedPools)
      for (const [poolId, pool] of Object.entries(fetchedPools)) {
        this.$set(this.pools, poolId, pool)
      }
    },
    fetchMissingPool: async function (inPos, setRemoveAction=false) {
      console.log('inPos', inPos)
      await this.fetchPools({p: inPos})
      if (!inPos.user)
        inPos.user = this.address
      if (inPos.positionType == 'concentrated' && (inPos.bidTick === null || inPos.askTick === null))
        return
      const possiblePositions = genSimilarPositions(inPos)
      console.log("possible positions", possiblePositions)
      await this.fetchPools(possiblePositions)
      await this.fetchPositionsLiq(possiblePositions)
      let chainId = inPos.chainId || this.chainId
      for (const pos of Object.values(possiblePositions)) {
        pos._baseDecimals = (await this.fetchTokenInfo(pos.base, chainId == this.chainId, chainId)).decimals
        pos._quoteDecimals = (await this.fetchTokenInfo(pos.quote, chainId == this.chainId, chainId)).decimals
        if (pos.qty) {
          if (pos.positionType == 'concentrated')
            pos.slot = concPosSlot(this.address, pos.base, pos.quote, pos.bidTick, pos.askTick, pos.poolIdx).toString()
          else
            pos.slot = ambientPosSlot(this.address, pos.base, pos.quote, pos.poolIdx).toString()
          if (pos.user == this.address && chainId == this.chainId)
            this.$set(this.positions, pos.slot, pos)
          if (setRemoveAction)
            this.setRemoveLp(pos.slot)
        }
      }
    },
    fetchTokens: async function (chainId) {
      const chainString = CROC_CHAINS[chainId].geckoChainString
      console.log(chainId, chainString)
      if (!chainString || Object.keys(this.COLD_TOKENS[chainId]).size > 0)
        return
      console.log('fetching tokens')

      let response
      try {
        response = await fetch(`https://tokens.coingecko.com/${chainString}/all.json`, {
          method: "GET",
          referrerPolicy: "no-referrer",
        });
      } catch (e) {
        console.log('token list fetch error', e)
        return
      }
      const resp = await response.json()
      for (const token of resp.tokens) {
        if (token.logoURI && token.logoURI.startsWith('https://assets.coingecko.com'))
          token.logoURI = token.logoURI.replace(/\/thumb\//, '/large/')
        token.symbolLower = token.symbol.toLowerCase()
        token.nameLower = token.name.toLowerCase()
        this.$set(this.COLD_TOKENS[chainId], token.address, token)
      }
    },
    // Catch-all function to get token info out of cache or fetch it from chain.
    // @TODO: it should probably fetch everything (balance, surplus, allowance)
    fetchTokenInfo: async function (address, fetchSurplus = false, chainId = null) {
      if (!address)
        return
      chainId = chainId || this.chainId
      address = address.toLowerCase()
      let token = this.TOKENS[chainId][address]
      if (!token) {
        token = this.COLD_TOKENS[chainId][address]
        if (token)
          this.$set(this.TOKENS[chainId], address, token)
      }
      if (!token) {
        console.log('token cache miss', address)
        try {
          token = await fetchToken({ address, chainId })
          token.symbolLower = token.symbol.toLowerCase()
          token.nameLower = token.name.toLowerCase()
          this.$set(this.TOKENS[chainId], address, token)
        } catch (e) {
          console.error('token fetch error', e)
          return
        }
      }
      if (fetchSurplus && this.address && this.surpluses[address] == undefined) {
        this.fetchSurpluses(this.address, [address], chainId)
      }
      return token
    },
    fetchWalletBalance: async function (tokenAddr) {
      if (!this.address) return
      tokenAddr = tokenAddr.toLowerCase()
      const balanceReq = { address: this.address }
      if (tokenAddr != ZERO_ADDRESS)
        balanceReq.token = tokenAddr
      const [_, wagmiBalance] = await Promise.all([this.fetchTokenInfo(tokenAddr, false), fetchBalance(balanceReq), this.fetchTokenAllowance(tokenAddr)])
      const balance = {
        raw: wagmiBalance.value,
        string: wagmiBalance.formatted,
        float: parseFloat(wagmiBalance.formatted),
        human: getFormattedNumber(parseFloat(wagmiBalance.formatted)),
      }
      this.$set(this.walletBalances, tokenAddr, balance)
    },
    fetchTokenAllowance: async function (tokenAddr) {
      if (tokenAddr == ZERO_ADDRESS)
        return
      const client = getPublicClient()
      const call = {
        address: tokenAddr, abi: [{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }],
        functionName: "allowance", args: [this.address, CROC_CHAINS[this.chainId].addrs.dex]
      }
      try {
        const allowance = await client.readContract(call)
        this.$set(this.allowances, tokenAddr, allowance)
      } catch (e) {
        console.error('allowance fetch error', e)
      }
      console.log('allowances', dump(this.allowances))
    },
    // fetches DEX balances either for given tokens, or tokens from the indexer, and optionally adds all current balances to either list
    fetchSurpluses: async function (owner, tokens = [], chainId = null) {
      chainId = chainId || this.chainId
      try {
        if (tokens.length == 0) {
          try {
            tokens = (await this.graphcache.user_balance_tokens(owner, numberToHex(chainId))).tokens
          } catch (e) {
            console.error("user_balance_tokens error")
          }
        }
        for (const tokenAddr of Object.keys(this.surpluses))
          if (!tokens.includes(tokenAddr))
            tokens.push(tokenAddr)
        if (tokens.indexOf(ZERO_ADDRESS) == -1)
          tokens.unshift(ZERO_ADDRESS)
        const someToken = getSomeTokenForChain(chainId)
        if (tokens.indexOf(someToken) == -1)
          tokens.push(someToken)
        // console.log(owner, tokens)
        const surpluses = await this.fetchSurplusAmounts(owner, tokens, chainId)
        console.log('surpluses', surpluses)
        for (const tokenAddr of tokens) {
          try {
            let balance = {}
            let token = { decimals: 18 }
            if (tokenAddr != ZERO_ADDRESS)
              token = await this.fetchTokenInfo(tokenAddr, false, chainId)
            balance.raw = surpluses[tokenAddr]
            balance.string = formatUnits(balance.raw, token.decimals)
            balance.float = parseFloat(balance.string)
            balance.human = getFormattedNumber(balance.float)
            if (chainId == this.chainId && owner == this.address)
              this.$set(this.surpluses, tokenAddr, balance)
          } catch (e) {
            console.error('surplus fetch error', e)
          }
        }
      } catch (e) {
        console.error('fetchSurpluses error', e)
      }
      console.log('surpluses', dump(this.surpluses))
    },
    fetchSurplusAmounts: async function (owner, tokens, chainId = null) {
      chainId = chainId || this.chainId
      const client = getPublicClient({ chainId })
      const qContract = {
        address: CROC_CHAINS[chainId].addrs.query,
        abi: QUERY_ABI
      }

      const calls = tokens.map((token) => { return { functionName: "querySurplus", args: [owner, token], ...qContract } })
      const reads = await client.multicall({ contracts: calls })
      const surpluses = {}
      for (const i in tokens)
        surpluses[tokens[i]] = reads[i].result

      return surpluses
    },
    // either qtyFrom or qtyTo should be set
    fetchSwapOutput: async function (from, to, poolIdx, qtyFrom, qtyTo, slippage = 0.5) {
      if (slippage < 0.1)
        slippage = 0.1
      else if (slippage > 99)
        slippage = 99
      // output - expected amount received/spent
      // minOut - same but with slippage
      // slipDirection - 1 if price going up is bad, -1 if price going down is bad
      // result - amount of tokens that will be received (not spent)
      const swap = { success: false, output: null, minOut: null, priceAfter: null, slipDirection: null, result: null, args: null }
      try {
        if (!qtyFrom && !qtyTo)
          return swap
        const client = getPublicClient()
        const iContract = {
          address: CROC_CHAINS[this.chainId].addrs.impact,
          abi: IMPACT_ABI
        }

        if (!poolIdx)
          poolIdx = CROC_CHAINS[this.chainId].poolIndex

        // true if the user wants to pay base token and receive quote token. false if the user wants to receive base token and pay quote token
        let isBuy = true
        let [base, quote] = [from, to]
        if (hexToBigInt(base) > hexToBigInt(quote)) {
          isBuy = false;
          [base, quote] = [to, from]
        }

        let inBaseQty = false
        if ((qtyFrom && from == base) || (qtyTo && to == base))
          inBaseQty = true

        const qty = qtyFrom ? qtyFrom : qtyTo

        const limitPrice = isBuy ? 0xffff5433e2b3d8211706e6102aa9471n : 65537n // temporary
        const args = [base, quote, poolIdx, isBuy, inBaseQty, qty, 0, limitPrice]
        console.log('args', args)
        const [baseFlow, quoteFlow, finalPrice] = await client.readContract({
          functionName: 'calcImpact', args, ...iContract
        })
        console.log('flows, price', baseFlow, quoteFlow, finalPrice)

        swap.success = true
        swap.args = { base, quote, poolIdx, isBuy, inBaseQty, qty, tip: 0, limitPrice }
        swap.output = inBaseQty ? quoteFlow : baseFlow
        swap.result = isBuy ? quoteFlow * -1n : baseFlow * -1n
        const outToken =
          swap.output = inBaseQty ^ isBuy ? swap.output : swap.output * -1n
        swap.priceAfter = finalPrice
        swap.slipDirection = inBaseQty ^ isBuy ? 1 : -1
        const slipBps = BigInt(parseInt(slippage * 100) * swap.slipDirection)
        const priceSlipBps = BigInt(parseInt(slippage * 100) * (isBuy ? 1 : -1))
        const scaler = 1000000000n  // i can't math and i can't integer math even more
        swap.minOut = swap.output + ((swap.output * scaler) / 10000n * slipBps) / scaler
        // this seems like a hack but it should work fine until normal swaps get fixed
        swap.args.limitPrice = finalPrice + ((finalPrice * scaler) / 10000n * priceSlipBps) / scaler
        console.log('prices', finalPrice, swap.args.limitPrice)
      } catch (e) {
        console.error('fetchSwapOutput error', e)
        swap.success = false
      }
      return swap
    },
    parseTx: async function (origInput) {
      origInput = origInput.toLowerCase()
      let txInput = origInput.match(/0x[0-9a-f]+/)
      if (!txInput)
        return
      txInput = txInput[0]
      this.$delete(this.parsedTxs, origInput)
      console.log('parseTx', txInput)
      const result = { success: false, description: "Couldn't parse this transaction", relayer: null }
      let calldata = txInput
      let sender = this.address
      let chainId = this.chainId

      if (origInput.indexOf('goerli.etherscan') != -1)
        chainId = goerli.id
      else if (origInput.indexOf('sepolia.etherscan') != -1)
        chainId = sepolia.id
      else if (origInput.indexOf('etherscan') != -1)
        chainId = mainnet.id
      else if (origInput.indexOf('sepolia.scrollscan') != -1 || origInput.indexOf('sepolia-blockscout.scroll.io') != -1)
        chainId = scrollSepolia.id
      else if (origInput.indexOf('scrollscan') != -1 || origInput.indexOf('scroll.io') != -1)
        chainId = scroll.id
      else if (origInput.indexOf('goerli.arbiscan') != -1)
        chainId = arbitrumGoerli.id
      else if (origInput.indexOf('arbiscan') != -1)
        chainId = arbitrum.id
      else if (origInput.indexOf('tuber.build') != -1 || origInput.indexOf('cantoscan') != -1)
        chainId = canto.id
      else if (origInput.indexOf('testnet.blastscan.io') != -1)
        chainId = blastSepolia.id
      else if (origInput.indexOf('blastscan.io') != -1)
        chainId = blast.id
      result.chainId = chainId

      if (txInput.length == 66) {
        const client = getPublicClient({ chainId })
        try {
          const tx = await client.getTransaction({ hash: txInput })
          if (!tx.to || tx.to.toLowerCase() != CROC_CHAINS[chainId].addrs.dex.toLowerCase()) {
            result.description = "Not an Ambient transaction"
            this.$set(this.parsedTxs, origInput, result)
            return
          }
          // const receipt = await client.getTransactionReceipt({ hash: txInput })
          // console.log(receipt)
          calldata = tx.input
          sender = tx.from
        } catch (e) {
          console.log(e)
          result.description = "Couldn't fetch this transaction. Are you connected to the correct network?"
          this.$set(this.parsedTxs, origInput, result)
          return
        }
      }

      try {
        const { functionName, args } = decodeFunctionData({ data: calldata, abi: CROC_ABI })
        try {
          if (functionName == 'userCmdRelayer') {
            result.relayer = await this.describeRelayer(args, chainId)
            sender = result.relayer.signer
          }
        } catch (e) {
          console.log('describe relayer error', e)
        }
        if (functionName == 'swap') {
          result.description = await this.describeSwap(args, chainId)
        } else if (functionName == 'userCmd' || functionName == 'userCmdRelayer') {
          const { description, position, surplus } = await this.describeUserCmd(args[0], args[1], sender, chainId)
          position.chainId = chainId
          console.log(description, position, surplus)
          result.description = description
          result.position = position
          result.surplus = surplus
          if (position.base) {
            try {
              await this.fetchMissingPool(position, false)
            } catch (e) {
              console.log('fetch parsed position failed', e)
            }
          }
          if (surplus.token && this.address && sender == this.address) {
            try {
              await this.fetchSurpluses(sender, [surplus.token])
            } catch (e) {
              console.log('fetch parsed surplus failed', e)
            }
          }
        } else {
          throw "unsupported"
        }
        result.success = true
      } catch (e) {
        console.log(e)
      }
      console.log(result)
      this.$set(this.parsedTxs, origInput, result)
    },
    describeSwap: async function (args, chainId) {
      let description = 'Swap'
      const base = await this.fetchTokenInfo(args[0], false, chainId)
      const quote = await this.fetchTokenInfo(args[1], false, chainId)
      const reformatted = formatUnits(args[5], args[4] ? base.decimals : quote.decimals)
      const qty = getFormattedNumber(parseFloat(reformatted))

      if (args[3] == true && args[4] == true) {
        description = `${description} ${qty} ${base.symbol} for ${quote.symbol}`
      } else if (args[3] == true && args[4] == false) {
        description = `${description} ${base.symbol} for ${qty} ${quote.symbol}`
      } else if (args[3] == false && args[4] == false) {
        description = `${description} ${qty} ${quote.symbol} for ${base.symbol}`
      } else if (args[3] == false && args[4] == true) {
        description = `${description} ${quote.symbol} for ${qty} ${base.symbol}`
      }
      return description
    },
    describeUserCmd: async function (callpath, cmd, sender, chainId) {
      let description = ""
      let position = { base: null, quote: null, bidTick: null, askTick: null, poolIdx: null, user: sender }
      let surplus = { token: null }
      if (callpath == CROC_CHAINS[chainId].proxyPaths.liq) {
        const args = decodeAbiParameters([
          { name: 'code', type: 'uint8' },
          { name: 'base', type: 'address' },
          { name: 'quote', type: 'address' },
          { name: 'poolIdx', type: 'uint256' },
          { name: 'bidTick', type: 'int24' },
          { name: 'askTick', type: 'int24' },
          { name: 'qty', type: 'uint128' },
          { name: 'limitLower', type: 'uint128' },
          { name: 'limitHigher', type: 'uint128' },
          { name: 'settleFlags', type: 'uint8' },
          { name: 'lpConduit', type: 'address' }
        ], cmd)
        console.log(args)

        let action
        let positionType
        if ([1, 11, 12].indexOf(args[0]) != -1) {
          action = 'Mint concentrated LP'
          positionType = 'concentrated'
        } else if ([2, 21, 22].indexOf(args[0]) != -1) {
          action = 'Burn concentrated LP'
          positionType = 'concentrated'
        } else if ([3, 31, 32].indexOf(args[0]) != -1) {
          action = 'Mint ambient LP'
          positionType = 'ambient'
        } else if ([4, 41, 42].indexOf(args[0]) != -1) {
          action = 'Burn ambient LP'
          positionType = 'ambient'
        } else if (args[0] == 5) {
          action = 'Harvest rewards'
          positionType = 'concentrated'
        } else {
          throw "unsupported lp action"
        }

        position.base = args[1].toLowerCase()
        position.quote = args[2].toLowerCase()
        position.poolIdx = args[3]
        position.bidTick = args[4]
        position.askTick = args[5]
        position.positionType = positionType

        description = `${action}`
        try {
          const base = await this.fetchTokenInfo(position.base, false, chainId)
          const quote = await this.fetchTokenInfo(position.quote, false, chainId)
          description = `${description} in ${base.symbol}/${quote.symbol} pool`

          if (positionType == 'concentrated') {
            const rangeMin = getFormattedNumber(parseFloat(toDisplayPrice(tickToPrice(position.askTick), base.decimals, quote.decimals, true)))
            const rangeMax = getFormattedNumber(parseFloat(toDisplayPrice(tickToPrice(position.bidTick), base.decimals, quote.decimals, true)))
            position._range = `${rangeMin} - ${rangeMax}`
          } else {
            position._range = 'ambient'
          }
        } catch (e) {
          console.log(e)
        }

      } else if (callpath == CROC_CHAINS[chainId].proxyPaths.long) {
        description = 'Repositining'
        cmd = cmd.substring(2)
        console.log(callpath, cmd)
        try {
          const openToken = ('0x' + cmd.substring(64 * 1 + (64 - 40), 64 * 1 + 64)).toLowerCase()
          let closeToken
          if (cmd.length >= 3264)
            closeToken = ('0x' + cmd.substring(64 * 45 + (64 - 40), 64 * 45 + 64)).toLowerCase()
          else
            closeToken = ('0x' + cmd.substring(64 * 39 + (64 - 40), 64 * 39 + 64)).toLowerCase()
          position.base = openToken < closeToken ? openToken : closeToken;
          position.quote = openToken > closeToken ? openToken : closeToken;
          position.poolIdx = BigInt('0x' + cmd.substring(64 * 26, 64 * 26 + 64))
          position.bidTick = ~~parseInt(cmd.substring(64 * 31 + (64 - 8), 64 * 31 + 64), 16)
          position.askTick = ~~parseInt(cmd.substring(64 * 32 + (64 - 8), 64 * 32 + 64), 16)
          position.positionType = cmd.length >= 3264 ? 'concentrated' : 'ambient' // hacky

          try {
            const base = await this.fetchTokenInfo(position.base, false, chainId)
            const quote = await this.fetchTokenInfo(position.quote, false, chainId)
            description = `${description} in ${base.symbol}/${quote.symbol} pool`

            if (position.positionType == 'concentrated') {
              const rangeMin = getFormattedNumber(parseFloat(toDisplayPrice(tickToPrice(position.askTick), base.decimals, quote.decimals, true)))
              const rangeMax = getFormattedNumber(parseFloat(toDisplayPrice(tickToPrice(position.bidTick), base.decimals, quote.decimals, true)))
              position._range = `${rangeMin} - ${rangeMax}`
            } else {
              position._range = 'ambient'
            }
          } catch (e) {
            throw e
          }
        } catch (e) {
          console.log('repositioning parse error', e)
          description = "Long form order (repositioning parsing error)"
          position.base = null
        }
      } else if (callpath == CROC_CHAINS[chainId].proxyPaths.cold) {
        const args = decodeAbiParameters(
          [
            { name: 'cmd', type: 'uint8' },
          ], cmd)

        if ([73, 74, 75].indexOf(args[0]) != -1) {
          const surplusArgs = decodeAbiParameters(
            [
              { name: 'cmd', type: 'uint8' },
              { name: 'recv', type: 'address' },
              { name: 'value', type: 'uint128' },
              { name: 'token', type: 'address' },
            ], cmd)
          const actions = { 73: 'Deposit', 74: 'Withdraw', 75: 'Transfer' }
          const token = await this.fetchTokenInfo(surplusArgs[3], false, chainId)
          const reformatted = formatUnits(surplusArgs[2], token.decimals)
          const dest = this.shortHash(surplusArgs[1], '…')
          const qty = getFormattedNumber(parseFloat(reformatted))
          surplus.token = surplusArgs[3].toLowerCase()
          description = `${actions[surplusArgs[0]]} ${qty} ${token.symbol} to ${dest}`

        } else {
          throw 'bad cold cmd'
        }
      } else {
        throw 'bad callpath'
      }
      return { description, position, surplus }
    },
    describeRelayer: async function (args, chainId) {
      try {
        const splSig = decodeAbiParameters(
          [
            { name: 'v', type: 'uint8' },
            { name: 'r', type: 'uint256' },
            { name: 's', type: 'uint256' },
          ],
          args[4])
        const rawSig = signatureToHex({ v: splSig[0], r: splSig[1], s: splSig[2] })
        const typedArgs = this.getTypedMessageArgs(args[0], args[1], args[2], args[3], chainId)
        typedArgs.signature = rawSig
        const signer = await recoverTypedDataAddress(typedArgs)
        let tip = '0'
        try {
          if (args[3] != '0x') {
            const tipArgs = decodeAbiParameters(
              [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint128' },
                { name: 'recv', type: 'address' },
              ],
              args[3])
            const token = await this.fetchTokenInfo(tipArgs[0], false, chainId)
            const tipQty = getFormattedNumber(parseFloat(formatUnits(tipArgs[1], token.decimals)))
            tip = `${tipQty} ${token.symbol}`
          }
        } catch (e) {
          console.log('tip error', e)
          tip = "decoding error"
        }
        return { signer, tip }
      } catch (e) {
        console.log('bad relayer', e)
      }
    },
    relayButtonDisabled: function (scmd) {
      let disabled = false
      if (this.relaying || (this.estimating && !scmd._action._relayManually))
        return true
      if (scmd._action._relayManually == false && !scmd._action.tip.amount && !scmd._action._selectedTipToken) {
        disabled = true
      }
      return disabled
    },
    relayButtonText: function (scmd) {
      if (scmd._action._relayManually == true) {
        return 'Send'
      } else {
        if (!scmd._action.tip.amount && !scmd._action._selectedTipToken)
          return 'Set a tip'
        else if (!scmd._action.tip.amount && scmd._action._selectedTipToken)
          return 'Sign with tip and relay'
        else
          return 'Relay'
      }
    },
    // if relayerEndpoint is set, will pool the tx status from the relayer
    // if sig is set, remove the signed command from this.signed after tx confirms
    waitForHash: async function (hash, relayerEndpoint = null, sig = null) {
      let timeout = 6.2 * 60_000 // flashbots tries to include the tx for 6 minutes
      if (!relayerEndpoint)
        timeout = 30 * 60_000
      if (hash) {
        let success = null
        this.$set(this.waitingHashes, hash, null)
        this.$nextTick(() => this.$refs.aboveWalletContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        try {
          const args = { hash, timeout, pollingInterval: 6_000, _relayerEndpoint: relayerEndpoint, _chainId: this.chainId }
          success = await this.pollTxStatus(args)
          console.log('got tx success', success)
        } catch (e) {
          console.error('waitForHash error', e)
        }
        // remove relayed command from this.signed
        if (sig) {
          const index = this.signed.options.findIndex((scmd) => scmd.sig === sig)
          if (this.signed.options.length == 1)
            this.signed.selected = null
          else
            this.signed.selected = this.signed.options[(index + 1) % this.signed.options.length].sig

          this.signed.options.splice(index, 1)
        }
        this.$set(this.waitingHashes, hash, success)
        await this.refreshData()
      }
    },
    pollTxStatus: async function (args) {
      const client = getPublicClient()
      const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
      const start = Date.now()
      while (true) {
        if (args.timeout > 0 && Date.now() - start > args.timeout)
          break
        await sleep(args.pollingInterval)
        try {
          if (!args._relayer) {
            const receipt = await client.getTransactionReceipt({ hash: args.hash })
            // console.log(receipt)
            if (receipt.blockHash) {
              return receipt.status == 'success' ? true : false
            }
          } else {
            const url = new URL(args._relayerEndpoint)
            url.pathname = '/status'
            url.searchParams.append('tx', args.hash)
            url.searchParams.append('chainId', args._chainId)

            const resp = await fetch(url)
            const json = await resp.json()
            if (json.success != null)
              return json.success

          }
        } catch (e) {
          // console.error('getTransaction error', e)
          continue
        }

      }
      return null
    },
    fetchUserInfo: async function () {
      if (!this.address) {
        this.ethBalance = '--'
        return
      }
      const client = getPublicClient()
      const ensClient = getPublicClient({chainId: '0x1'})
      let [ensName, balance] = await Promise.allSettled([ensClient.getEnsName({ address: this.address }), client.getBalance({ address: this.address })]);

      let symbol = this.chain.chain.nativeCurrency.symbol
      if (balance.status == 'fulfilled')
        this.ethBalance = `${getFormattedNumber(parseFloat(formatEther(balance.value)))} ${symbol}`
      if (ensName.status == 'fulfilled')
        this.ensName = ensName.value
      if (this.ensName && !this.ensAvatar)
        this.ensAvatar = await ensClient.getEnsAvatar({ name: normalize(this.ensName) })
    },
    switchToChain: async function (id) {
      const wallet = await getWalletClient({ chainId: this.chainId })
      await wallet.switchChain({ id })
    },
    removeTip: function (scmd) {
      scmd.tip = '0x'
      scmd._action.tip.amount = 0
      scmd._action.tip.token = null
      scmd._action.tip.recv = null
    },
    tipAmountHuman: function (tip) {
      if (!this.chainId)
        return '???'
      const token = this.TOKENS[this.chainId][tip.token]
      if (!token)
        return '???'
      const humanAmount = parseFloat(formatUnits(tip.amount, token.decimals))
      return `${getFormattedNumber(humanAmount)} ${token.symbol}`
    },
    showToast: function (title, text, variant = "info", noAutoHide = false) {
      this.$bvToast.toast(text, {
        title: title,
        toaster: "b-toaster-top-center",
        solid: false,
        appendToast: true,
        variant: variant,
        autoHideDelay: 5000,
        noAutoHide,
      });
    },
    termsAccepted: function () {
      localStorage.termsAccepted = "1"
    },
    txLink: function (hash) {
      const explorer = CROC_CHAINS[this.chainId].blockExplorer
      return `${explorer}tx/${hash}`
    },
    removeWaitingHash: function (hash) {
      this.$delete(this.waitingHashes, hash)
      if (Object.keys(this.waitingHashes).length == 0) {
        this.relaying = false
        this.signing = false
      }
    },
    onVisibilityChange() {
      this.autoRefreshPaused = document.hidden
    }
  },
  watch: {
    address: function (address) {
      console.log('got address', address)
      if (address) {
        this.resetData(false, true)
        this.refreshData(address)
      } else {
        this.resetData(false, true)
      }
    },
  },
  computed: {
    canSign: function () {
      if (!this.address || !this.chainId)
        return false
      return true
    },
  },
  mounted: function () {
    watchAccount((account) => this.accountChanged(account))
    watchNetwork((network) => this.networkChanged(network))
    if (this.refreshTicker == null)
      this.refreshTicker = setInterval(async () => {
        if (Date.now() - this.lastRefresh < REFRESH_PERIOD || this.autoRefreshPaused)
          return
        if (this.chain && this.address)
          await this.refreshData()
        this.lastRefresh = Date.now()
      }, 1000);
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.fetchTokens(mainnet.id)
  },
  unmounted: function () {
    if (this.refreshTicker) {
      clearInterval(this.refreshTicker)
      this.refreshTicker = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  },
};
</script>

<style lang="scss">
@import 'node_modules/@forevolve/bootstrap-dark/scss/bootstrap-dark.scss';

$bg: #0d1117;

body,
html {
  width: 100%;
  height: 100%;
  background-color: $bg;
}

select,
input,
button.input-like {
  background-color: darken($bg, 1%) !important;
}

a {
  color: darken($blue, 0%);
}

a:hover {
  color: darken($blue, 15%);
}

w3m-balance {
  margin-right: auto;
}

* {
  font-family: Helvetica;
  box-sizing: border-box;
}

#wrapper {
  width: 100%;
  height: 100%;
  display: flex;
}

#main-ui-wrapper {
  margin-top: auto;
  margin-bottom: auto;
  padding: 0;
}

.main-panel {
  padding: 1rem 1rem 1em 1em;
  background-color: lighten($bg, 3%);
  max-width: 22rem;
}

.panel-col {
  margin-bottom: 0.5rem;
}

#logo {
  width: 100%;
}

#footer {
  font-size: 0.8rem;
  color: $gray-600;
}

#footer a {
  color: darken($gray-600, 15%);
}

.load-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
}

/* Define the animation keyframes */
@keyframes loading-underline {
  0% {
    left: 0;
    width: 0;
  }

  50% {
    left: 0;
    width: 100%;
  }

  100% {
    left: 100%;
    width: 0;
  }
}

.animated-underline {
  position: relative;
  padding-bottom: 0.5em;
}

.animated-underline::after {
  content: "";
  position: absolute;
  margin-top: 0.5em;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #6c757d;
  animation: loading-underline 1s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
}

.collapsed>.when-open,
.not-collapsed>.when-closed {
  display: none;
}

#b-header-dropdown button {
  color: inherit !important;
}


.icon-spin {
  animation: spin-animation 1s infinite;
  animation-timing-function: linear;
  display: inline-block;
}

@keyframes spin-animation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(359deg);
  }
}

#w3-button-container {
  text-align: center;
  outline: 0;
}

#w3-connected {
  background-color: darken($bg, 1%);
  padding: 0.2rem 0.5rem 0.2rem 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  width: 100%;
  outline: none;
  cursor: default;
}

#w3-address-pill {
  margin: 0.1rem 0 0.1rem 0.3rem;
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
  padding: 0.3rem 0.5rem 0.3rem 0.3rem;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
}

.with-avatar {
  padding-left: 0.2rem !important;
}
</style>
