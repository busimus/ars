<template>
  <div id="wrapper">
    <div id="main-ui-wrapper" style="padding-top: 0.5em; padding-bottom: 0.5em" class="container-fluid">
      <div id="main-ui" class="main-panel border shadow-sm rounded">
        <img id="logo" alt="Ambient Relay Service" src="./assets/ars_logo.svg" style="margin-bottom: 0.7rem" />
        <!-- <hr style="margin-top: 1rem; margin-bottom: 0.5rem" /> -->
        <a href="#collapseIndicatorChevronDark" v-b-toggle.collapse-about @click.prevent class="text-center"
          style="display: block;  margin-bottom: 0.5rem;" data-bs-toggle="collapse" aria-expanded="false"
          aria-controls="collapseIndicatorChevronDark">
          About
          <b-icon-chevron-down class="when-closed" />
          <b-icon-chevron-up class="when-open" />
        </a>
        <b-collapse id="collapse-about" style="text-align: justify;">
          <p style="margin-bottom: 0.5rem;">
            This is an alternative frontend for <a href="https://ambient.finance" target="_blank">Ambient Finance</a>.
          </p>
          <p style="margin-bottom: 0.5rem;">
            You can use it to send gasless transactions by tipping gas
            out of your DEX balance.
          </p>
        </b-collapse>
        <hr style="margin-top: 0rem; margin-bottom: 0.5rem" />

        <div id="w3-button-container">
          <w3m-core-button balance="show" name="wallet_button"></w3m-core-button>
          <div v-for="(_, hash) in waitingHashes"
            style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem;">
            <a href="#" style="flex: 1; padding-bottom: 0.5rem; visibility: hidden">
              <b-icon-x />
            </a>
            <div class="text-center animated-underline">
              Waiting for
              <a :href="txLink(hash)" target="_blank">{{
                shortHash(hash)
              }}</a>
            </div>
            <a href="#" style="flex: 1; padding-bottom: 0.5rem; color: inherit;" @click.prevent="removeWaitingHash(hash)">
              <b-icon-x />
            </a>
          </div>
        </div>

        <hr style="margin-top: 0.5rem" />
        <div v-if="address && chainId">
          <ExchangePositions :balances="balances" :positions="positions" :pools="pools" :refreshing="refreshing"
            @refresh="refreshData" @withdraw="(a) => setWithdrawTarget(a, true)"
            @transfer="(a) => setWithdrawTarget(a, false)" @removeLp="setRemoveLp" />
        </div>
        <div class="text-center" v-else>
          Connect wallet to see positions and balances
          <hr />
        </div>
        <ActionInput ref="actionInput" @perform="performAction" :pools="pools" :tokens="TOKENS[chainId]"
          :address="address" :signing="signing" :canSign="canSign" />
      </div>
      <div ref="signedCmdsPanel" v-if="Object.keys(signed.options).length > 0" id="signed-cmds-panel"
        class="main-panel border shadow-sm rounded">
        <h4 class="text-center">Signed commands</h4>
        <b-form-group id="input-group-relayer" label="Signed command" label-for="input-selected-scmd">
          <b-form-select id="input-selected-scmd" v-model="signed.selected" size="sm" :options="signed.options"
            value-field="sig" required></b-form-select>
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
                    :options="scmd._action._tipEstimates" value-field="token" required></b-form-select>
                </div>
                <b-button variant="dark" @click="estimateTips(scmd)" style="flex: 1" title="Estimate gas cost">
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
              <small class="form-text text-muted text-center mb-2">Will be deducted from your exchange balance (and the
                command will be automatically adjusted to ensure you have enough left)</small>
            </b-form-group>
            <div id="attached-tip" v-if="scmd._action.tip.amount" style="display: flex; align-items: center; gap: 0.5rem">
              <span style="height: fit-content">Attached tip: {{ this.tipAmountHuman(scmd._action.tip) }}</span>
              <b-button @click=removeTip(scmd) variant="light"><b-icon-trash /></b-button>
            </div>

            <b-form-checkbox id="checkbox-relayManually" v-model="scmd._action._relayManually" name="checkbox-relayer"
              class="mb-2">
              Send manually <b-icon-question-circle id="relayManuallyQuestion" />
            </b-form-checkbox>
            <b-tooltip target="relayManuallyQuestion" triggers="hover">
              Send the TX from the connected address.<br /> Could be any address, as long as it has ETH for gas.
            </b-tooltip>
            <b-button ref="relayButton" :variant="relaying ? 'outline-success' : 'success'" size="lg" style="width: 100%" type=submit
              :disabled="relayButtonDisabled(scmd)">
              <div v-if="relaying" class="load-spinner spinner-border spinner-border-md" role="status">
                <span class="sr-only">{{ scmd._action._relayManually ? 'Sending...' : 'Relaying...' }}</span>
              </div>
              <div v-else>{{ relayButtonText(scmd) }}</div>
            </b-button>
          </b-form>
        </div>
      </div>
      <div id="footer" class="text-center">
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
} from "./utils.jsx";
import {
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

import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/html'
import { configureChains, createConfig, getPublicClient, getWalletClient, fetchToken } from '@wagmi/core'
import { mainnet, goerli, arbitrum, arbitrumGoerli } from '@wagmi/core/chains'

const chains = [mainnet, goerli, arbitrumGoerli, arbitrum]
const projectId = '8978c906351c8a4e3eccd85a700306ab'

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)
const web3modal = new Web3Modal({ projectId, themeMode: 'light' }, ethereumClient)

import { ethers, BigNumber } from "ethers";
import { roundForConcLiq } from '@crocswap-libs/sdk'
import cloneDeep from 'lodash.clonedeep'

import { watchAccount, watchNetwork, signTypedData } from '@wagmi/core'
import { encodeAbiParameters, toHex, numberToHex, hexToBigInt, formatUnits, formatEther } from 'viem'

import ExchangePositions from './components/ExchangePositions.vue'
import ActionInput from './components/ActionInput.vue'
import { GraphcacheProvider, GRAPHCACHE_PROVIDERS } from './graphcache_provider.js'
import { getFormattedNumber } from './number_formatting.jsx'
import { lpBaseTokens, lpQuoteTokens } from './utils.jsx'
import { CROC_CHAINS } from './constants.js'
import { CROC_ABI } from './abis/croc.js'
import { QUERY_ABI } from './abis/query.js'
import { COMMANDS, SETTLE_TO_DEX } from './dex_actions.jsx'
import { TOKENS } from './tokens.js'

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const RELAYERS = {
  bus: {
    value: 'bus',
    text: "bus",
    endpoint: 'https://relayer.bus.bz/',
    acceptedTipTokens: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", ZERO_ADDRESS]
    // acceptedTipTokens: ["0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", ZERO_ADDRESS,]//, "0x630f8b9d8f517af8f5b8670e6a167b6c0240d583"],
  }
}

// approximate amount of gas that adding a tip costs (since it's not possible to estimate gas with a tip)
const RELAYER_GAS_TIP_MARKUP = 15000n

export default {
  name: "App",
  components: {
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
      balances: {},
      pools: {},
      signed: {
        selected: null,
        options: []
      },
      accountWatch: null,
      networkWatch: null,
      signing: false,
      relaying: false,
      refreshing: 0,
      estimating: false,
      refreshTicker: null,
      waitingHashes: {},
      RELAYERS,
      TOKENS,
    };
  },
  methods: {
    accountChanged: function (account) {
      console.log('accountChanged', account)
      this.account = account
      this.address = account.address
    },
    networkChanged: function (network) {
      console.log('networkChanged', network)
      this.network = network
      if (network.chain) {
        this.chainId = network.chain.id
        this.refreshData()
      } else {
        this.chainid = undefined
        this.resetData()
      }
    },
    setWithdrawTarget: function (tokenAddr, withdraw) {
      let action = cloneDeep({ ...COMMANDS.withdraw })
      if (!withdraw)
        action = cloneDeep({ ...COMMANDS.transfer })
      action.token = tokenAddr
      action.qty = this.balances[tokenAddr].balanceHuman
      action._qtyRaw = this.balances[tokenAddr].balance
      action._qtyDecimals = this.balances[tokenAddr].decimals
      console.log('setting action', action)
      this.$refs.actionInput.setAction(action)
      this.$nextTick(() => {
        this.$refs.actionInput.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    setRemoveLp: function (positionId) {
      console.log('setRemoveLp', positionId)
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
      this.signing = true;
      const action = cloneDeep({ ...actionInput })
      let cmd = null
      try {
        if (action._type == 'withdraw') {
          cmd = this.buildWithdrawSurplusCmd(action, true)
        } else if (action._type == 'transfer') {
          cmd = this.buildWithdrawSurplusCmd(action, false)
        } else if (action._type == 'removeConcLp') {
          cmd = this.buildRemoveConcLpCmd(action)
        } else if (action._type == 'removeAmbLp') {
          cmd = this.buildRemoveAmbLpCmd(action)
        } else {
          throw "Can't perform this action"
        }

        if (action._useRelayer != true) {
          const hash = await this.sendUserTx(cmd)
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
      }
      this.signing = false
    },
    buildRemoveConcLpCmd: function (action) {
      console.log(action)
      const callpath = 2
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
      const callpath = 2
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
      const callpath = CROC_CHAINS[this.chainId].withdrawCallpath
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
    signCmd: async function (cmd) {
      console.log('signCmd', cmd)
      try {
        const nonce = 0
        console.log('nonce', nonce)
        const salt = toHex(ethers.utils.randomBytes(32))
        // const salt = keccak256(this.address + 'ASR') // salting the salt to not collide with anyone else who's also using deterministic salt
        const relayer = cmd._action._relayerAddr ? cmd._action._relayerAddr : ZERO_ADDRESS

        const conds = encodeAbiParameters(
          [
            { name: 'deadline', type: 'uint48' },
            { name: 'alive', type: 'uint48' },
            { name: 'salt', type: 'bytes32' },
            { name: 'nonce', type: 'uint32' },
            { name: 'relayer', type: 'address' }
          ],
          [281474976710655n, 0, salt, nonce, relayer]
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
          if (cmd._action._selectedTipToken == null)
            await this.estimateTips(signedCmd)
          const sim = await this.sendRelayerTx(signedCmd, true)
        } catch (e) {
          console.log('tip or sim error', e)
          throw "Transaction simulation failed, try creating the command again"
        }

        return signedCmd
      } catch (e) {
        console.error('signCmd exception', e)
        this.showToast('Signing exception', e, 'danger', true)
        throw e
      }
    },
    sendUserTx: async function (cmd) {
      console.log('sendUserTx', cmd)
      try {
        const client = getPublicClient()
        const sim = await client.simulateContract({
          functionName: 'userCmd', args: [cmd.callpath, cmd.cmd],
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: this.account
        })
        console.log('sim', sim)
        const wallet = await getWalletClient({ chainId: this.chainId })
        return await wallet.writeContract(sim.request)
      } catch (e) {
        console.error('sendUserTx error', e)
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
        throw e
      }
    },
    relayOrSend: async function (event, scmd) {
      event.preventDefault()
      this.relaying = true
      try {
        if (scmd._action._relayManually == true) {
          const hash = await this.sendRelayerTx(scmd)
          await this.waitForHash(hash)
        } else {
          const tipToken = scmd._action._selectedTipToken
          const clonedScmd = cloneDeep(scmd)
          clonedScmd._action.tip = { token: tipToken, amount: scmd._action._tipEstimates[tipToken].amount }
          console.log("relaying!", dump(clonedScmd))
          console.lo
          try {
            this.ensureBalance(clonedScmd)
          } catch (e) {
            console.error('ensure error', e)
            this.showToast("Tip error", e, "danger")
            throw e
          }
          const resignedCmd = await this.signCmd(clonedScmd)
          const hash = await this.relay(resignedCmd)
          console.log('got hash', hash)
          await this.waitForHash(hash)
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
      const tipTokenBalance = this.balances[tip.token] ? this.balances[tip.token].balance : 0n
      console.log('tip', tip, tipTokenBalance)

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
      // If not withdrawing and have enough balance
      if (tipTokenBalance >= BigInt(tip.amount)) {
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
        if (a.settleFlags == SETTLE_TO_DEX) {
          if ((a.base == tip.token && baseRatio > minRatio) || (a.quote == tip.token && quoteRatio > minRatio)) {
            return true
          }
        }
      }
      throw "Not enough DEX balance for tip"
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
        this.showToast("Relay exception", e, "danger")
        throw e
      }
      this.showToast("Relay success", 'Waiting for transaction to confirm', "success")
      return resp ? resp.hash : null;
    },
    // calculates minimum tip amounts of acceptable tip tokens and sets action._tipEstimates
    estimateTips: async function (signedCmd) {
      if (this.estimating)
        return
      this.estimating = true
      const tipOptions = {}
      try {
        const relayer = RELAYERS[signedCmd._action._selectedRelayer]
        const gas = await this.estimateRelayerGas(signedCmd)
        const client = getPublicClient()
        // const gasPrice = 1000000000000n
        const gasPrice = await client.getGasPrice()
        signedCmd._action._gasPrice = `${Math.ceil(parseInt(gasPrice) / 1000000000)} gwei`
        const gasInWei = gas * gasPrice
        const gasInETH = formatEther(gasInWei)
        console.log('gasPrice', gasPrice)
        console.log('gasInWei', gas * gasPrice)
        if (relayer.acceptedTipTokens.indexOf(ZERO_ADDRESS) != -1) {
          tipOptions[ZERO_ADDRESS] = { token: ZERO_ADDRESS, text: `${parseFloat(gasInETH).toFixed(6)} ETH`, amount: gasInWei.toString() }
        }

        for (const tokenAddress of relayer.acceptedTipTokens) {
          if (tokenAddress == ZERO_ADDRESS)
            continue
          const token = this.TOKENS[this.chainId][tokenAddress]
          let price = null
          try {
            price = await this.getPrice(tokenAddress, ZERO_ADDRESS)
          } catch (e) {
            console.error('getPrice error', e)
            continue
          }
          // console.log('price', price)

          const amount = BigInt(Math.round(parseInt(gasInWei) / price))
          let amountHuman = formatUnits(amount, token.decimals)
          if (["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c"].indexOf(tokenAddress) != -1)
            amountHuman = parseFloat(amountHuman).toFixed(3)
          tipOptions[tokenAddress] = { token: tokenAddress, text: `${amountHuman} ${token.symbol}`, amount: amount.toString() }
        }
        console.log('tipOptions', tipOptions)
        signedCmd._action._tipEstimates = tipOptions
        if (!signedCmd._action._selectedTipToken) {
          console.log(relayer.acceptedTipTokens[0])
          signedCmd._action._selectedTipToken = relayer.acceptedTipTokens[0]
        }
      } catch (e) {
        console.error('estimateTips error', e)
      }
      this.estimating = false
      return tipOptions
    },
    // return onchain decoded price of an asset relative to some other asset, assuming a pool exists
    getPrice: async function (priceOf, relativeTo) {
      const invert = hexToBigInt(priceOf) > hexToBigInt(relativeTo)
      if (invert)
        [priceOf, relativeTo] = [relativeTo, priceOf]
      const pos = { base: priceOf, quote: relativeTo, poolIdx: CROC_CHAINS[this.chainId].poolIndex }
      let pool = this.pools[poolKey(pos)]
      if (!pool) {
        const pools = await this.fetchPools([pos])
        if (!pools)
          throw "no such pool"
        this.pools[poolKey(pos)] = pools[poolKey]
        pool = pools[poolKey(pos)]
      }
      return pool.priceDecoded
    },
    // this estimate always seems high
    estimateRelayerGas: async function (cmd) {
      try {
        const client = getPublicClient()
        let gas = await client.estimateContractGas({
          functionName: 'userCmdRelayer', args: [cmd.callpath, cmd.cmd, cmd.conds, cmd.tip, cmd.sig],
          address: CROC_CHAINS[this.chainId].addrs.dex, abi: CROC_ABI,
          account: this.account
        })
        if (cmd.tip == '0x')
          gas += RELAYER_GAS_TIP_MARKUP
        console.log('gas', gas)
        return gas
      } catch (e) {
        console.error('sendRelayerTx error', e)
      }
    },
    signData: async function (callpath, cmd, conds, tip) {
      console.log("chainId", this.chainId)
      const domain = {
        name: "CrocSwap",
        chainId: this.chainId,
        verifyingContract: CROC_CHAINS[this.chainId].addrs.dex
      }

      if (this.chainId == 1)
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

      const signature = await signTypedData({
        domain, types, message, primaryType: 'CrocRelayerCall',
      })
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
      try {
        this.positions = await this.fetchPositions(this.address)
        this.pools = await this.fetchPools(this.positions)
        this.balances = await this.fetchBalances(this.address)
      } catch (e) {
        console.error("refreshData error", e)
      }
      this.refreshing -= 1
    },
    resetData: function () {
      this.balances = {}
      this.positions = {}
      this.pools = {}
    },
    fetchPositions: async function (owner) {
      const positions = {}
      try {
        const resp = await this.graphcache.user_positions(owner, numberToHex(this.chainId))
        console.log('positions resp', resp)
        for (const pos of resp) {
          if (pos.ambientLiq == 0 && pos.concLiq == 0 && pos.rewardLiq == 0) {
            continue
          }
          try {
            const base = await this.fetchTokenInfo(pos.base)
            const quote = await this.fetchTokenInfo(pos.quote)
            pos._baseDecimals = base.decimals
            pos._quoteDecimals = quote.decimals
            pos.baseSymbol = base.symbol
            pos.quoteSymbol = quote.symbol
          } catch (e) {
            pos._baseDecimals = 18
            pos._quoteDecimals = 18
            pos.baseSymbol = "???"
            pos.quoteSymbol = "???"
          }
          positions[pos.positionId] = pos
        }
        await this.fetchPositionsLiq(positions)
      } catch (e) {
        console.error('fetchPositions error', e)
      }
      console.log('positions', dump(positions))
      return positions
    },
    // fetches and updates pos.qty from the chain
    fetchPositionsLiq: async function (positions) {
      const client = getPublicClient()
      const qContract = {
        address: CROC_CHAINS[this.chainId].addrs.query,
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
      console.log('fetchPositionsLiq', reads)
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
    fetchPools: async function (positions) {
      const client = getPublicClient()
      const qContract = {
        address: CROC_CHAINS[this.chainId].addrs.query,
        abi: QUERY_ABI, functionName: "queryPrice",
      }

      const pools = {}
      for (const pos of Object.values(positions)) {
        pools[poolKey(pos)] = { base: pos.base, quote: pos.quote, poolIdx: pos.poolIdx }
      }

      const poolIds = Object.keys(pools)
      const calls = poolIds.map((id) => { return { args: [pools[id].base, pools[id].quote, pools[id].poolIdx], ...qContract } })
      const reads = await client.multicall({ contracts: calls })
      for (const i in poolIds) {
        const pool = pools[poolIds[i]]
        console.log('fetched pool', poolIds[i], pool, reads[i])
        if (reads[i].status != "success") {
          console.error('pool fetch failure', poolIds[i])
        }
        const price = reads[i].result
        pool.priceRaw = price
        const decoded = decodeCrocPrice(price)
        pool.priceDecoded = decoded
        const baseToken = await this.fetchTokenInfo(pool.base)
        const quoteToken = await this.fetchTokenInfo(pool.quote)
        pool.price = toDisplayPrice(decoded, baseToken.decimals, quoteToken.decimals, true)
      }
      console.log('pools', dump(pools))
      return pools
    },
    fetchTokenInfo: async function (address) {
      address = address.toLowerCase()
      let token = this.TOKENS[this.chainId][address]
      if (token)
        return token
      console.log('token cache miss', address)
      token = await fetchToken({ address, chainId: this.chainId })
      this.TOKENS[this.chainId][address] = token
      return token
    },
    fetchBalances: async function (owner) {
      const balances = {}
      try {
        const resp = await this.graphcache.user_balance_tokens(owner, numberToHex(this.chainId))
        // console.log('tokens resp', resp)
        // @TODO: remove for prod
        if (resp.tokens.indexOf(ZERO_ADDRESS) == -1)
          resp.tokens.unshift(ZERO_ADDRESS)
        if (resp.tokens.indexOf("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") == -1)
          resp.tokens.push("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
        const surpluses = await this.fetchSurpluses(owner, resp.tokens)
        console.log('surpluses', surpluses)
        for (const tokenAddr of resp.tokens) {
          try {
            let token = {}
            if (tokenAddr != ZERO_ADDRESS) {
              token = await this.fetchTokenInfo(tokenAddr)
            } else {
              token = { name: 'Ethereum', symbol: 'ETH', decimals: 18, address: ZERO_ADDRESS }
            }
            token.balance = surpluses[tokenAddr]
            token.balanceHuman = formatUnits(token.balance, token.decimals)
            if (token.balance > 0)
              balances[tokenAddr] = token
          } catch (e) {
            console.error('surplus fetch error', e)
          }
        }
      } catch (e) {
        console.error('fetchBalances error', e)
      }
      console.log('balances', dump(balances))
      return balances;
    },
    fetchSurpluses: async function (owner, tokens) {
      const client = getPublicClient()
      const qContract = {
        address: CROC_CHAINS[this.chainId].addrs.query,
        abi: QUERY_ABI
      }

      const calls = tokens.map((token) => { return { functionName: "querySurplus", args: [owner, token], ...qContract } })
      const reads = await client.multicall({ contracts: calls })
      const surpluses = {}
      for (const i in tokens)
        surpluses[tokens[i]] = reads[i].result

      return surpluses
    },
    relayButtonDisabled: function (scmd) {
      let disabled = false
      if (this.relaying)
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
    waitForHash: async function (hash) {
      if (hash) {
        this.$set(this.waitingHashes, hash, null)
        const client = getPublicClient()
        try {
          const args = { hash, timeout: 60_000, pollingInterval: 6_000 }
          await this.waitForTx(args)
        } catch (e) {
          console.error('waitForTransactionReceipt error', e)
        }
        this.removeWaitingHash(hash)
        await this.refreshData()
      }
    },
    waitForTx: async function (args) {
      const client = getPublicClient()
      const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
      const start = Date.now()
      while (true) {
        await sleep(args.pollingInterval)
        try {
          const tx = await client.getTransaction({ hash: args.hash })
          console.log(tx)
          if (tx.blockHash)
            break
        } catch (e) {
          console.error('getTransaction error', e)
          continue
        }

        if (Date.now() - start > args.timeout)
          break
      }
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
        noAutoHide,
      });
    },
    termsAccepted: function () {
      localStorage.termsAccepted = "1"
    },
    txLink: function (hash) {
      const chains = { 1: "etherscan.io", 5: 'goerli.etherscan.io' }
      const base = chains[this.chainId]
      return `https://${base}/tx/${hash}`
    },
    shortHash: function (hash) {
      return hash.slice(0, 6) + ".." + hash.slice(-4);
    },
    removeWaitingHash: function (hash) {
      this.$delete(this.waitingHashes, hash)
    },
  },
  watch: {
    address: function (address) {
      console.log('got address', address)
      if (address) {
        this.refreshData(address)
      } else {
        this.resetData()
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
    if (!localStorage.termsAccepted)
      this.$refs["warning-modal"].show();

    watchAccount((account) => this.accountChanged(account))
    watchNetwork((network) => this.networkChanged(network))
    if (this.refreshTicker == null)
      this.refreshTicker = setInterval(async () => await this.refreshData(), 30000);
  },
  unmounted: function () {
    if (this.refreshTicker) {
      clearInterval(this.refreshTicker)
      this.refreshTicker = null;
    }
  },
};
</script>

<style>
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
  max-width: 20rem;
  padding: 0;
}

.main-panel {
  padding: 1rem 1rem 1em 1em;
  background-color: white;
  margin-bottom: 0.5em;
}

#logo {
  width: 100%;
}

#footer {
  margin-top: 0.7rem;
}

#footer .source {
  font-size: 0.9rem;
  color: #666;
}

#footer a {
  color: #777;
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

/* Create the CSS class for the animated underline */
.animated-underline {
  position: relative;
  padding-bottom: 0.5em;
  /* display: inline-block; */
}

/* Add the pseudo-element and apply the animation */
.animated-underline::after {
  content: "";
  position: absolute;
  margin-top: 0.5em;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  /* Adjust the underline thickness as needed */
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

body,
html {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
}

#w3-button-container {
  text-align: center;
}
</style>
