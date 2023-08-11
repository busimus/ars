<template>
  <div id="action-input">
    <h4 style="text-align: center">
      Command input
    </h4>
    <b-form-select v-model="actionType" value-field="_type" :options="COMMANDS"></b-form-select>
    <b-form @submit="perform">
      <br />
      <!-- swap should probably be its own component but i want to get off mr. Vue's composability ride -->
      <div v-if="actionType == 'swap'">
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-from-qty" label-for="input-from-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-from-qty" v-model="action._fromQty" placeholder="0.0"
              @input="swapInputHandler(action._fromQty, 0)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ dexBalanceHuman(action._fromToken) }} <a href="#"
                @click.prevent="setSwapToMax('from')">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action._fromToken" @update:address="a => { setSwapToken('from', a) }" :tokens="tokens"
            :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
        <div style="text-align: center;">
          <b-button v-b-hover="h => invertSwapIcon = h" @click="invertSwap" variant="outline-dark"
            style="transition: 0.1s; color: inherit; display: inline-block; margin-bottom: 0.5rem; border: none;">
            <b-icon-arrow-down-short v-if="!invertSwapIcon" />
            <b-icon-arrow-down-up style="padding: 0.2rem" v-else />
          </b-button>
        </div>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-to-qty" label-for="input-to-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-to-qty" v-model="action._toQty" placeholder="0.0"
              @input="swapInputHandler(0, action._toQty)" required></b-form-input>
            <!-- <small class="form-text text-muted">DEX balance: {{ dexBalanceHuman(action._toToken) }} <a href="#"
                @click.prevent="setSwapToMax('to')">Max</a></small> -->
          </b-form-group>
          <CoinSelector :address="action._toToken" @update:address="a => { setSwapToken('to', a) }" :tokens="tokens"
            :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
        <div class="border rounded p-2" v-if="action._estimate != null && action._estimate.success"
          style="display: flex; flex-direction:column; gap: 0.25rem; margin-top: 1rem">
          <div style="display: flex; justify-content: space-between;">
            <span style="margin: auto 0; padding: 0.1rem 0;">{{ action._estimate.slipDirection < 0 ? 'Minimum output'
              : 'Maximum input' }}</span><span>{{ swapResultHuman(action)
  }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="margin: auto 0">Slippage %</span><b-form-input id="input-swap-slippage"
              v-model="action._slippage" type="number" trim placeholder="0" min="0.1" max="99" step="0.1" size="sm"
              @input="swapInputHandler(action._fromQty, action._toQty)" style="max-width: 5rem;" />
          </div>
        </div>
        <div v-else-if="action._estimate != null && !action._estimate.success"
          class="border rounded text-center p-2 text-danger" style="margin-top: 1rem">
          Swap estimation failed!
        </div>
      </div>
      <div v-else-if="actionType == 'withdraw'">
        <!-- flex here makes the layout a little taller, awful -->
        <label id="input-group-withdraw-recv" for="input-withdraw-recv" class="d-block"
          style="margin-bottom: 0.1rem;">Recipient</label>
        <div style="display: flex; gap: 0.4rem">
          <!-- horrible prop binding because v-model:address doesn't work -->
          <AddressInput :address="action.recv" @update:address="a => action.recv = a" :name="'withdraw-recv'"
            :placeholder="'Defaults to connected address'" :description="'Where tokens will be sent'" :tokens="tokens"
            :required="false" />
          <!-- disgusting style, revolting -->
          <b-button style="height: fit-content;" class="input-like" @click="setRecvToSelf"
            title="Use currently connected address"><b-icon-wallet-2 /></b-button>
        </div>

        <label id="input-group-withdraw-qty" for="input-withdraw-qty" class="d-block"
          style="margin-bottom: 0.1rem;">Amount to withdraw</label>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-withdraw-qty" label-for="input-withdraw-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-withdraw-qty" v-model="action.qty" placeholder="0.0"
              @update="reparseUnits(action.qty, '_qtyRaw', action.token)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ dexBalanceHuman(action.token) }} <a href="#"
                @click.prevent="setWithdrawMax">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action.token" @update:address="a => { action.token = a; setWithdrawMax() }"
            :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
      </div>
      <div v-else-if="actionType == 'transfer'">
        <AddressInput :address="action.recv" @update:address="a => action.recv = a" :name="'transfer-recv'"
          :label="'Recipient'" :placeholder="'Address'" :description="'Where DEX balance will be sent'"
          :tokens="tokens" />

        <label id="input-group-transfer-qty" for="input-transfer-qty" class="d-block"
          style="margin-bottom: 0.1rem;">Amount to transfer</label>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-transfer-qty" label-for="input-transfer-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-transfer-qty" v-model="action.qty" placeholder="0.0"
              @update="reparseUnits(action.qty, '_qtyRaw', action.token)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ dexBalanceHuman(action.token) }} <a href="#"
                @click.prevent="setWithdrawMax">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action.token" @update:address="a => { action.token = a; setWithdrawMax() }"
            :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
      </div>
      <div v-else-if="actionType == 'deposit'">
        <div v-if="!action._gasless">
          <label id="input-group-deposit-recv" for="input-deposit-recv" class="d-block"
            style="margin-bottom: 0.1rem;">Recipient</label>
          <div style="display: flex; gap: 0.4rem">
            <!-- horrible prop binding because v-model:address doesn't work -->
            <AddressInput :address="action.recv" @update:address="a => action.recv = a" :name="'deposit-recv'"
              :placeholder="'Defaults to connected address'" :description="'Where tokens will be deposited'"
              :tokens="tokens" :required=false />
            <!-- disgusting style, revolting -->
            <b-button style="height: fit-content;" class="input-like" @click="setRecvToSelf"
              title="Use currently connected address"><b-icon-wallet-2 /></b-button>
          </div>
        </div>

        <label id="input-group-deposit-qty" for="input-deposit-qty" class="d-block" style="margin-bottom: 0.1rem;">Amount
          to deposit</label>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-deposit-qty" label-for="input-deposit-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-deposit-qty" v-model="action.qty" placeholder="Amount"
              @update="reparseUnits(action.qty, '_qtyRaw', action.token)" required></b-form-input>
            <small class="form-text text-muted">Wallet balance: {{ walletBalanceHuman(action.token) }} <a href="#"
                @click.prevent="setDepositMax">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action.token" @update:address="a => { action.token = a; }" :tokens="tokens"
            :cold_tokens="coldTokens" :balances="walletBalances" @fetchToken="t => $emit('fetchWalletBalance', t)" />
        </div>
        <div style="margin-top: 1rem">
          <b-alert v-if="action._gasless && NO_PERMIT_SUPPORT.includes(action.token)" variant="danger" show
            class="smaller-alert">{{ this.tokens[action.token].symbol }} doesn't support
            gasless deposits</b-alert>
          <b-alert v-else-if="action._gasless && !PERMIT_SUPPORT.includes(action.token)" variant="warning" show
            class="smaller-alert">Some tokens don't
            support gasless
            deposits. <a href="#" @click.prevent="$refs['gasless-deposits-modal'].show()">See list</a></b-alert>
        </div>
      </div>
      <div v-else-if="actionType == 'removeConcLp' || actionType == 'removeAmbLp'">
        <b-form-group>
          <div style="display: flex; gap: 0.4rem">
            <CoinSelector :label="'Base token'" :address="action.base" @update:address="a => { action.base = a }"
              :useSurplus="action._baseSurplus" :surplusDirection="'to'"
              @update:useSurplus="u => { action._baseSurplus = u }" :tokens="tokens" :cold_tokens="coldTokens"
              :balances="balances" @fetchToken="t => $emit('fetchToken', t)" style="flex: 1" />
            <CoinSelector :label="'Quote token'" :address="action.quote" @update:address="a => { action.quote = a }"
              :useSurplus="action._quoteSurplus" :surplusDirection="'to'"
              @update:useSurplus="u => { action._quoteSurplus = u }" :tokens="tokens" :cold_tokens="coldTokens"
              :balances="balances" @fetchToken="t => $emit('fetchToken', t)" style="flex: 1" />
          </div>
        </b-form-group>
        <div v-if="actionType == 'removeConcLp'" style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-removeLp-bidTick" label="Range min" label-for="input-removeLp-bidTick"
            style="flex: 1;" required>
            <b-form-input id="input-removeLp-bidTick" v-model="action._rangeMin" @change="reparseTick('min')"
              placeholder="0.0" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-askTick" label="Range max" label-for="input-removeLp-askTick"
            style="flex: 1;" required>
            <b-form-input id="input-removeLp-askTick" v-model="action._rangeMax" @change="reparseTick('max')"
              placeholder="0.0" required></b-form-input>
          </b-form-group>
        </div>
        <div style="display: flex; gap: 0.6rem">
          <b-form-group id="input-group-removeLp-qtyPct" :label="'Amount: ' + action._qtyPct + '%'"
            label-for="input-removeLp-qtyPct" style="flex: 2;" required>
            <b-form-input id="input-removeLp-qtyPct" v-model="action._qtyPct" placeholder="0" type="range" min=1 max=100
              style="margin-top: 0.5rem; background-color: inherit !important;" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-slippage" label="Slippage %" label-for="input-removeLp-slippage"
            style="flex: 1" required>

            <b-form-input id="input-removeLp-slippage" v-model="action._slippage" placeholder="0.5" type="number"
              step="0.1" min="0.2" @change="setSlippageLimits" required></b-form-input>
          </b-form-group>
        </div>
        <div class="border rounded p-2"
          v-if="['removeConcLp', 'removeAmbLp'].includes(actionType) && poolFilled && poolValid"
          style="display: flex; flex-direction:column; gap: 0.25rem; margin-top: 0rem">
          <div style="display: flex; justify-content: space-between;">
            <span style="margin: auto 0; padding: 0.1rem 0;">Removed base</span><span>{{ lpRemovedBaseTokens }} {{
              tokens[action.base].symbol }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="margin: auto 0; padding: 0.1rem 0;">Removed quote</span><span>{{ lpRemovedQuoteTokens }} {{
              tokens[action.quote].symbol }}</span>
          </div>
        </div>
        <div v-else-if="poolValid == false" class="border rounded text-center text-danger p-2">
          Pool not found
        </div>
      </div>
      <div v-else class="text-center">
        Most commands can be automatically filled in using buttons in the exchange pane
      </div>
      <div v-if="actionType" style="display: flex; justify-content: center; margin-top: 0.7rem">
        <b-form-checkbox id="checkbox-gasless" v-if="actionType" v-model="action._gasless" name="checkbox-gasless" switch
          size="lg">
          Gasless
        </b-form-checkbox>
        <b-icon-question-circle id="gaslessQuestion" style="margin: 0.5rem 0 0 0.5rem" />
        <b-tooltip target="gaslessQuestion" triggers="hover">
          You'll need to tip the relayer from your DEX balance
        </b-tooltip>
      </div>
      <b-button type="submit" v-if="actionType" :variant="sendButtonVariant()" size="lg"
        style="width: 100%; margin-top: 0.5rem" :disabled="!canSign || signing || actionImpossible == true">
        <div v-if="signing" class="load-spinner spinner-border spinner-border-md" role="status">
          <span class="sr-only">{{ signButtonText }}</span>
        </div>
        <div v-else-if="!signing">{{ signButtonText }}</div>
      </b-button>
    </b-form>
    <b-modal ref="gasless-deposits-modal" title="Gasless deposit support" ok-only ok-variant="primary" size="lg" centered>
      <b-form-textarea id="gasless-tokens-textarea" v-model="GASLESS_DEPOSIT_INFO" readonly rows="7" wrap="soft" />
    </b-modal>

  </div>
</template>
<script>
import {
  BAlert,
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormCheckbox,
  BFormTextarea,
  BFormInvalidFeedback,
  BIconArrowClockwise,
  BIconArrowDownShort,
  BIconQuestionCircle,
  BIconArrowDownUp,
  BIconArrowBarUp,
  BIconWallet2,
  BButton,
  BModal,
  BCollapse,
  BTooltip,
} from "bootstrap-vue";

import AddressInput from "./AddressInput.vue";
import CoinSelector from "./CoinSelector.vue"

import cloneDeep from "lodash.clonedeep";
import { parseUnits, formatUnits } from "viem"
import { fromDisplayPrice, encodeCrocPrice, tickToPrice, priceToTick, toDisplayPrice } from '@crocswap-libs/sdk'
import { getFormattedNumber } from "../number_formatting.jsx"
import { COMMANDS } from '../dex_actions.jsx'
import { isValidAddress, lpBaseTokens, lpQuoteTokens, poolKey } from '../utils.jsx'
import { SETTLE_TO_WALLET, BASE_TO_DEX, QUOTE_TO_DEX, SETTLE_TO_DEX } from "../dex_actions";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const GASLESS_DEPOSIT_INFO = `Tokens with confirmed support for gasless deposits:
USDC, UNI, stETH, wstETH, LUSD, R, RSR, ARB, 1INCH.

If the token you're interested in isn't listed then try it anyway – if you can create a signed deposit command without errors then it's supported.`

// @TODO: eyes hurt
const PERMIT_SUPPORT = ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", "0x17144556fd3424edc8fc8a4c940b2d04936d17eb", "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0", "0x5f98805a4e8be255a32880fdec7f6728c6568ba0", "0x320623b8e4ff03373931769a31fc52a4e78b5d70", "0x183015a9ba6ff60230fdeadc3f43b3d788b13e21", "0x111111111117dc0aa78b770fa6a738034120c302", "0xb50721bcf8d664c30412cfbc6cf7a15145234ad1"]
const NO_PERMIT_SUPPORT = ["0x0000000000000000000000000000000000000000", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "0x6982508145454ce325ddbe47a25d4ec3d2311933", "0x6b175474e89094c44da98b954eedeac495271d0f", "0xdc31ee1784292379fbb2964b3b9c4124d8f89c60", "0xc04b0d3107736c32e19f1c62b2af67be61d63a05", "0xdac17f958d2ee523a2206206994597c13d831ec7", "0x5a98fcbea516cf06857215779fd812ca3bef1b32", "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9", "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919"]

export default {
  name: "ActionInput",
  components: {
    AddressInput,
    CoinSelector,
    BAlert,
    BForm,
    BFormGroup,
    BFormInput,
    BFormSelect,
    BFormCheckbox,
    BFormTextarea,
    BFormInvalidFeedback,
    BFormInvalidFeedback,
    BIconArrowClockwise,
    BIconArrowDownUp,
    BIconArrowDownShort,
    BIconQuestionCircle,
    BIconArrowBarUp,
    BIconWallet2,
    BButton,
    BModal,
    BCollapse,
    BTooltip,
  },
  data: function () {
    return {
      action: { ...COMMANDS['swap'] },
      swapDebouncer: 0,
      swapOutput: 0,
      swapPriceAfter: 0,
      invertSwapIcon: false,
      COMMANDS,
      ZERO_ADDRESS,
      GASLESS_DEPOSIT_INFO,
      PERMIT_SUPPORT,
      NO_PERMIT_SUPPORT,
    };
  },
  emits: ['perform', 'fetchToken', 'fetchWalletBalance', 'approve'],
  props: {
    pools: Object,
    tokens: Object,
    coldTokens: Object,
    balances: Object,
    walletBalances: Object,
    allowances: Object,
    address: String,
    crocChain: Object,
    signing: Boolean,
    canSign: Boolean,
    fetchSwapOutput: Function,
  },
  methods: {
    setAction: function (action) {
      this.action = { ...action }
      // yeah i think i'm done with Vue.
      this.$nextTick(() => {
        this.action = { ...action };
        if (this.action._type == 'swap')
          this.preFillSwapTokens()
        else if (this.action._type == 'removeConcLp') {
          this.reparseTick('min')
          this.reparseTick('max')
        }
      })
      // all of these don't work:
      // this.action = Object.assign({}, this.action, {...action})
      // Object.assign(this.action, { ...action })
      // for (const [key, val] of Object.entries(action))
      //   this.$set(this.action, key, val)
    },
    resetAction: function () {
      this.setAction(COMMANDS['swap'])
    },
    hoverSwapIcon: function (isHovered) {
      this.invertSwapIcon = isHovered
    },
    // there has to be a way of handling potentially unknown decimals better
    reparseUnits: function (valueString, field, tokenAddress) {
      if (!this.tokens[tokenAddress])
        return
      try {
        this.action[field] = parseUnits(valueString, this.tokens[tokenAddress].decimals)
      } catch {
        this.action[field] = null
      }
    },
    // converts action._rangeMin to action.bidTick or whatever depending on side
    reparseTick: function (side) {
      const pool = this.pools[poolKey(this.action)]
      if (!pool)
        return
      const baseDec = this.tokens[this.action.base].decimals
      const quoteDec = this.tokens[this.action.quote].decimals
      console.log(side, this.action._rangeMin, this.action._rangeMax)

      let price = 0
      let tick = this.action[side == 'min' ? 'askTick' : 'bidTick']
      if ((side == 'min' ? this.action._rangeMin : this.action._rangeMax) > 0) {
        price = fromDisplayPrice(parseFloat(side == 'min' ? this.action._rangeMin : this.action._rangeMax), baseDec, quoteDec, true)
        tick = priceToTick(price)
        this.action[side == 'min' ? 'askTick' : 'bidTick'] = tick
      }

      const reprice = toDisplayPrice(tickToPrice(tick), baseDec, quoteDec, true)
      console.log(price, tick, reprice)
      this.action[side == 'min' ? '_rangeMin' : '_rangeMax'] = reprice
    },
    setRecvToSelf: function () {
      this.action.recv = this.address
    },
    setWithdrawMax: function () {
      const balance = this.balances[this.action.token]
      if (!balance)
        return
      this.action._qtyRaw = balance.raw
      this.action.qty = balance.string
    },
    setDepositMax: function () {
      const balance = this.walletBalances[this.action.token]
      if (!balance)
        return
      this.action._qtyRaw = balance.raw
      this.action.qty = balance.string
    },
    setSwapToMax: function (side) {
      if (side == 'from') {
        const balance = this.balances[this.action._fromToken]
        if (balance)
          this.action._fromQty = balance.string
        this.swapInputHandler(this.action._fromQty, 0)
      } else if (side == 'to') {
        // remove this lmao
        const balance = this.balances[this.action._toToken]
        if (balance)
          this.action._toQty = balance.string
        this.swapInputHandler(0, this.action._toQty)
      }
    },
    swapInputHandler: function (qtyFrom, qtyTo) {
      // console.log('from', qtyFrom, typeof (qtyFrom))
      // console.log('to  ', qtyTo, typeof (qtyTo))
      // if both are specified it either takes the direction of last estimate
      // or defaults to the normal direction
      if (qtyFrom && qtyTo) {
        if (this.action._estimate && this.action._estimate.success) {
          if (this.action._estimate.slipDirection < 0) {
            qtyTo = null
          } else {
            qtyFrom = null
          }
        } else {
          qtyTo = null
        }
      }
      if (qtyFrom === '' || qtyTo === '') {
        this.action._fromQty = null
        this.action._toQty = null
        this.action._estimate = null
        this.action._estimateTime = Date.now()
        return
      }
      if (typeof (qtyFrom) == 'string')
        this.action._toQty = null
      if (typeof (qtyTo) == 'string')
        this.action._fromQty = null
      if (qtyFrom <= 0 && qtyTo <= 0) {
        return
      }
      if (!this.action._fromToken || !this.action._toToken)
        return
      let fromQtyRaw, toQtyRaw
      if (qtyFrom > 0) {
        fromQtyRaw = parseUnits(qtyFrom, this.tokens[this.action._fromToken].decimals)
        this.action._toQty = '...'
        this.action._toQtyRaw = 0
      } else if (qtyTo > 0) {
        toQtyRaw = parseUnits(qtyTo, this.tokens[this.action._toToken].decimals)
        this.action._fromQty = '...'
        this.action._fromQtyRaw = 0
      } else {
        return
      }
      this.swapDebouncer += 1
      const reqTime = Date.now()
      if (this.swapDebouncer <= 1) {
        this.action._fromQtyRaw = fromQtyRaw
        this.action._toQtyRaw = toQtyRaw
        this.maybeGetSwapOutput(fromQtyRaw, toQtyRaw, reqTime)
      } else {
        setTimeout(() => {
          this.swapDebouncer -= 1
          this.action._fromQtyRaw = fromQtyRaw
          this.action._toQtyRaw = toQtyRaw
          this.maybeGetSwapOutput(fromQtyRaw, toQtyRaw, reqTime)
        }, 200)
      }
    },
    invertSwap: function () {
      [this.action._fromQty, this.action._toQty] = [this.action._toQty, this.action._fromQty];
      [this.action._fromToken, this.action._toToken] = [this.action._toToken, this.action._fromToken];
      this.swapInputHandler(this.action._fromQty, 0)
    },
    refreshSwap: async function () {
      if (this.actionType == 'swap')
        this.swapInputHandler(this.action._fromQty, this.action._toQty)
    },
    setSwapToken: function (side, address) {
      console.log('side', side, address, this.action._fromToken, this.action._toToken)
      if (side == 'from') {
        if (this.action._toToken == address)
          return
        this.action._fromQty = null
        this.action._fromQtyRaw = 0n
        this.action._fromToken = address
      } else if (side == 'to') {
        if (this.action._fromToken == address)
          return
        this.action._toQty = null
        this.action._toQtyRaw = 0n
        this.action._toToken = address
      }
      this.action._estimate = null
      this.action._estimateTime = Date.now()
      this.maybeGetSwapOutput(this.action._fromQtyRaw, this.action._toQtyRaw, Date.now())
    },
    maybeGetSwapOutput: async function (qtyFrom, qtyTo, reqTime) {
      console.log('maybeGet', this.swapDebouncer, qtyFrom, qtyTo)
      if (this.swapDebouncer > 1 || (!qtyFrom && !qtyTo))
        return

      const swap = await this.fetchSwapOutput(this.action._fromToken, this.action._toToken, this.action.poolIdx, qtyFrom, qtyTo, this.action._slippage)
      console.log('swapOutput', swap)
      if (this.action._estimateTime > reqTime) {
        console.log('stale swap output, dropping')
        return
      }
      this.action._estimate = swap
      this.action._estimateTime = reqTime
      if (!swap.success) {
        return
      }
      if (qtyFrom) {
        this.action._toQtyRaw = swap.output
        this.action._toQty = formatUnits(swap.output, this.tokens[this.action._toToken].decimals)
      } else {
        this.action._fromQtyRaw = swap.output
        this.action._fromQty = formatUnits(swap.output, this.tokens[this.action._fromToken].decimals)
      }
    },
    setSlippageLimits: function () {
      const pool = this.pools[poolKey(this.action)]
      if (!pool)
        return
      if (this.action._slippage > 99)
        this.action._slippage = 99
      if (this.action._slippage < 0.1)
        this.action._slippage = 0.1
      // these are obviously swapped but that's the only way it works lmao
      const lowLimit = pool.price * (1 + this.action._slippage / 100)
      const highLimit = pool.price * (1 - this.action._slippage / 100)
      console.log(lowLimit, highLimit)

      const encodedLower = fromDisplayPrice(lowLimit, this.action._baseDecimals, this.action._quoteDecimals, true)
      this.action.limitLower = encodeCrocPrice(encodedLower).toString()
      const encodedHigher = fromDisplayPrice(highLimit, this.action._baseDecimals, this.action._quoteDecimals, true)
      this.action.limitHigher = encodeCrocPrice(encodedHigher).toString()
    },
    describe: function () {
      const a = this.action;
      try {
        if (this.actionType == 'withdraw' || this.actionType == 'transfer') {
          let qty = a._qtyRaw
          if (qty == 0n)
            qty = this.balances[a.token]
          const reformatted = formatUnits(qty, this.tokens[a.token].decimals)
          const amount = getFormattedNumber(parseFloat(reformatted))
          const shortRecv = `${a.recv.substring(0, 8)}…${a.recv.substring(36)}`;
          const subCmd = this.actionType == 'withdraw' ? 'Withdraw' : 'Transfer'
          a._description = `${subCmd}: ${amount} ${this.tokens[a.token].symbol} to ${shortRecv}`
        } else if (this.actionType == 'deposit') {
          const reformatted = formatUnits(a._qtyRaw, this.tokens[a.token].decimals)
          const amount = getFormattedNumber(parseFloat(reformatted))
          const shortRecv = `${a.recv.substring(0, 8)}…${a.recv.substring(36)}`;
          a._description = `Deposit: ${amount} ${this.tokens[a.token].symbol} to ${shortRecv}`
        } else if (['removeConcLp', 'removeAmbLp'].indexOf(this.actionType) != -1) {
          const amtBase = `${this.lpRemovedBaseTokens} ${this.tokens[a.base].symbol}`
          const amtQuote = `${this.lpRemovedQuoteTokens} ${this.tokens[a.quote].symbol}`
          const settlement = this.describeSettlement(a)
          a._description = `Remove LP: ${amtBase} + ${amtQuote}${settlement}`
        } else if (this.actionType == 'swap') {
          console.log('describing', this.action)
          if (a._estimate.slipDirection < 0) {
            const reformatted = formatUnits(a._fromQtyRaw, this.tokens[a._fromToken].decimals)
            const qty = getFormattedNumber(parseFloat(reformatted))
            a._description = `Swap: ${qty} ${this.tokens[a._fromToken].symbol} for ${this.tokens[a._toToken].symbol}`
          } else {
            const reformatted = formatUnits(a._toQtyRaw, this.tokens[a._toToken].decimals)
            const qty = getFormattedNumber(parseFloat(reformatted))
            a._description = `Swap: ${this.tokens[a._fromToken].symbol} for ${qty} ${this.tokens[a._toToken].symbol}`
          }
        } else {
          throw `Can't describe this action ${this.actionType}`
        }
      } catch (e) {
        console.error('describe error', e)
      }
    },
    describeSettlement: function (action) {
      if (['removeConcLp', 'removeAmbLp'].indexOf(this.actionType) != -1) {
        const base = this.tokens[action.base].symbol
        const quote = this.tokens[action.quote].symbol
        if ((action.settleFlags & 0b00000011) == SETTLE_TO_DEX) {
          return " to DEX balance"
        } else if ((action.settleFlags & 0b00000011) == SETTLE_TO_WALLET) {
          return " to wallet"
        } else if ((action.settleFlags & 0b00000011) == BASE_TO_DEX) {
          return `, ${base} to DEX and ${quote} to wallet`
        } else if ((action.settleFlags & 0b00000011) == QUOTE_TO_DEX) {
          return `, ${quote} to DEX and ${base} to wallet`
        } else {
          console.error(action.settleFlags, action.settleFlags & 0b00000011)
        }
      } else {
        throw `Can't describe settlement for ${this.actionType}`
      }
    },
    perform: function (event) {
      event.preventDefault()
      if (['removeConcLp', 'removeAmbLp'].indexOf(this.actionType) != -1)
        this.setSlippageLimits()
      else if (this.actionType == 'swap') {
        if (!this.action._estimate) {
          console.warn('no estimate for the swap')
          return
        }
      } else if (this.actionType == 'deposit') {
        if (!this.action.recv || this.action._gasless)
          this.action.recv = this.address
        if (this.needTokenApproval) {
          this.$emit('approve', this.action.token, this.action._qtyRaw)
          return
        }
      } else if (this.actionType == 'withdraw') {
        if (!this.action.recv)
          this.action.recv = this.address
      }

      if (this.action.settleFlags != undefined) {
        this.action.settleFlags = (this.action._baseSurplus ? 1 : 0) | (this.action._quoteSurplus ? 2 : 0)
        console.log('flags', this.action.settleFlags)
      }

      this.describe()
      this.$emit('perform', this.action)
    },
    dexBalanceHuman: function (tokenAddress) {
      const token = this.tokens[tokenAddress]
      const balance = this.balances[tokenAddress]
      if (!balance || !token)
        return '...'
      return balance.human
    },
    walletBalanceHuman: function (tokenAddress) {
      const token = this.tokens[tokenAddress]
      const balance = this.walletBalances[tokenAddress]
      if (!balance || !token)
        return '...'
      return balance.human
    },
    swapResultHuman: function (action) {
      if (action._estimate == null && action._estimate.minOut)
        return '??'
      const token = this.tokens[action._estimate.slipDirection < 0 ? action._toToken : action._fromToken]
      return `${getFormattedNumber(formatUnits(action._estimate.minOut, token.decimals))} ${token.symbol}`
    },
    sendButtonVariant: function () {
      let color = this.action._gasless ? 'primary' : 'success'
      return this.signing ? `outline-${color}` : color
    },
    preFillSwapTokens: function () {
      const chain = this.crocChain.chainId
      if (chain == 1) {
        this.action._fromToken = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      } else if (chain == 5) {
        this.action._fromToken = "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c"
      } else if (chain == 421613) {
        this.action._fromToken = "0xc944b73fba33a773a4a07340333a3184a70af1ae"
      }
      console.log(this.action._fromToken)
      this.action._toToken = ZERO_ADDRESS
    }
  },
  computed: {
    actionType: {
      get: function () {
        return this.action._type
      },
      set: function (actionType) {
        this.action = cloneDeep(COMMANDS[actionType])
        if (this.action._type == 'swap') {
          this.preFillSwapTokens()
        }
      }
    },
    actionImpossible: function () {
      const a = this.action
      if (a._type == 'deposit') {
        if (!this.walletBalances[a.token] || a._qtyRaw > this.walletBalances[a.token].raw)
          return true
        if (a._gasless && NO_PERMIT_SUPPORT.includes(a.token))
          return true
        if (!a._gasless && a._qtyRaw > this.allowances[a.token])
          return false // can be approved
      } else if (a._type == 'withdraw' || a._type == 'transfer') {
        if (a._qtyRaw <= 0)
          return true
      } else if (a._type == 'swap') {
        if (a._fromToken && this.balances[a._fromToken] && a._fromQtyRaw > this.balances[a._fromToken].raw)
          return true
      }
    },
    signButtonText: function () {
      const a = this.action
      if (this.needTokenApproval)
        return this.signing ? 'Approving...' : 'Approve'

      if (!this.signing)
        return a._gasless ? 'Sign' : 'Send'
      else
        return a._gasless ? 'Signing...' : 'Sending...'
    },
    needTokenApproval: function () {
      return this.actionType == 'deposit' && !this.action._gasless && this.action._qtyRaw > this.allowances[this.action.token]
    },
    poolFilled: function () {
      if (isValidAddress(this.action.base) == true && isValidAddress(this.action.quote) == true)
        return true
      else
        return false
    },
    poolValid: function () {
      if (this.poolFilled) {
        const pool = this.pools[poolKey(this.action)]
        if (pool)
          return true
        else
          return false
      } else {
        return false
      }
    },
    lpRemovedBaseTokens: function () {
      if (this.poolValid)
        try {
          return lpBaseTokens(this.action, this.pools[poolKey(this.action)], this.action._qtyPct, true)
        } catch (e) {
          console.error('lpRemovedBaseTokens error', e)
        }
      return 0
    },
    lpRemovedQuoteTokens: function () {
      if (this.poolValid)
        try {
          return lpQuoteTokens(this.action, this.pools[poolKey(this.action)], this.action._qtyPct, true)
        } catch (e) {
          console.error('lpRemovedBaseTokens error', e)
        }
      return 0
    },
  },
  mounted: function () {
    if (this.action._type == 'swap') {
      this.preFillSwapTokens()
    }
  },
  watch: {
    crocChain: function (chain) {
      if (this.action._type == 'swap') {
        this.preFillSwapTokens()
      }
    },
  }
};

</script>

<style>
.form-group label {
  margin-bottom: 0.1rem;
}

.smaller-alert {
  padding: 0.5rem 1rem !important;
}
</style>


