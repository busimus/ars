<template>
  <div id="action-input">
    <h4 style="text-align: center">
      Command input
    </h4>
    <b-form-select v-model="actionType" value-field="_type" :options="COMMANDS"></b-form-select>
    <b-form v-if="actionType" @submit="perform">
      <br />
      <!-- swap should probably be its own component tbh but i want to get off mr. Vue's composability ride -->
      <div v-if="actionType == 'swap'">
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-from-qty" label-for="input-from-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-from-qty" v-model="action._fromQty" placeholder="0.0"
              @input="swapInputHandler(action._fromQty, 0)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ balanceHuman(action._fromToken) }} <a href="#"
                @click.prevent="setSwapToMax('from')">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action._fromToken" @update:address="a => setSwapToken('from', a)" :tokens="tokens"
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
            <small class="form-text text-muted">DEX balance: {{ balanceHuman(action._toToken) }} <a href="#"
                @click.prevent="setSwapToMax('to')">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action._toToken" @update:address="a => setSwapToken('to', a)" :tokens="tokens"
            :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
      </div>
      <div v-if="actionType == 'withdraw'">
        <!-- flex here makes the layout a little taller, awful -->
        <label id="input-group-withdraw-recv" for="input-withdraw-recv" class="d-block"
          style="margin-bottom: 0.1rem;">Recipient</label>
        <div style="display: flex; gap: 0.4rem">
          <!-- horrible prop binding because v-model:address doesn't work -->
          <AddressInput :address="action.recv" @update:address="a => action.recv = a" :name="'withdraw-recv'"
            :placeholder="'Address'" :description="'Where tokens will be sent'" :tokens="tokens" />
          <!-- disgusting style, revolting -->
          <b-button style="height: fit-content;" class="input-like" @click="setRecvToSelf"
            title="Use currently connected address"><b-icon-wallet-2 /></b-button>
        </div>

        <label id="input-group-withdraw-qty" for="input-withdraw-qty" class="d-block"
          style="margin-bottom: 0.1rem;">Amount to withdraw</label>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-withdraw-qty" label-for="input-withdraw-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-withdraw-qty" v-model="action.qty" placeholder="0 to withdraw everything"
              @update="reparseUnits(action.qty, '_qtyRaw', action.token)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ balanceHuman(action.token) }} <a href="#"
                @click.prevent="setWithdrawMax">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action.token" @update:address="a => { action.token = a; setWithdrawMax() }"
            :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
      </div>
      <div v-if="actionType == 'transfer'">
        <AddressInput :address="action.recv" @update:address="a => action.recv = a" :name="'transfer-recv'"
          :label="'Recipient'" :placeholder="'Address'" :description="'Where DEX balance will be sent'"
          :tokens="tokens" />

        <label id="input-group-transfer-qty" for="input-transfer-qty" class="d-block"
          style="margin-bottom: 0.1rem;">Amount to transfer</label>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-transfer-qty" label-for="input-transfer-qty" class="mb-0" style="width: 100%">
            <b-form-input id="input-transfer-qty" v-model="action.qty" placeholder="0 to transfer everything"
              @update="reparseUnits(action.qty, '_qtyRaw', action.token)" required></b-form-input>
            <small class="form-text text-muted">DEX balance: {{ balanceHuman(action.token) }} <a href="#"
                @click.prevent="setWithdrawMax">Max</a></small>
          </b-form-group>
          <CoinSelector :address="action.token" @update:address="a => { action.token = a; setWithdrawMax() }"
            :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)" />
        </div>
      </div>
      <div v-else-if="actionType == 'removeConcLp' || actionType == 'removeAmbLp'">
        <!-- <div style="display: flex; gap: 0.4rem">
          <AddressInput :address="action.base" @update:address="a => action.base = a" :name="'removeLp-base'"
            :label="'Base token'" :placeholder="'Token address'" :tokens="tokens" :isToken="true" />
          <AddressInput :address="action.quote" @update:address="a => action.quote = a" :name="'removeLp-quote'"
            :label="'Quote token'" :placeholder="'Token address'" :tokens="tokens" :isToken="true" />
        </div> -->
        <b-form-group>
          <div style="display: flex; gap: 0.4rem">
            <CoinSelector :label="'Base token'" :address="action.base" @update:address="a => { action.base = a }"
              :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)"
              style="flex: 1" />
            <CoinSelector :label="'Quote token'" :address="action.quote" @update:address="a => { action.quote = a }"
              :tokens="tokens" :cold_tokens="coldTokens" :balances="balances" @fetchToken="t => $emit('fetchToken', t)"
              style="flex: 1" />
          </div>
        </b-form-group>
        <div v-if="actionType == 'removeConcLp'" style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-removeLp-bidTick" label="Bid tick" label-for="input-removeLp-bidTick"
            style="flex: 1;" required>
            <b-form-input id="input-removeLp-bidTick" v-model="action.bidTick" placeholder="0" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-askTick" label="Ask tick" label-for="input-removeLp-askTick"
            style="flex: 1;" required>
            <b-form-input id="input-removeLp-askTick" v-model="action.askTick" placeholder="0" required></b-form-input>
          </b-form-group>
        </div>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-removeLp-poolIdx" label="Pool index" label-for="input-removeLp-poolIdx"
            style="flex: 1;" required>
            <b-form-input id="input-removeLp-poolIdx" v-model="action.poolIdx" placeholder="420" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-settleFlags" label="Settle output" label-for="input-removeLp-settleFlags"
            style="flex: 2;" required>
            <b-form-select id="input-removeLp-settleFlags" v-model="action.settleFlags" :options="SETTLE_FLAGS"
              required></b-form-select>
          </b-form-group>
        </div>
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-removeLp-qtyPct" :label="'Amount: ' + action._qtyPct + '%'"
            label-for="input-removeLp-qtyPct" style="flex: 2;" required>
            <b-form-input id="input-removeLp-qtyPct" v-model="action._qtyPct" placeholder="0" type="range" min=1 max=100
              style="margin-top: 0.5rem" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-slippage" label="Slippage %" label-for="input-removeLp-slippage"
            style="flex: 1" required>

            <b-form-input id="input-removeLp-slippage" v-model="action._slippage" placeholder="0.5" type="number"
              step="0.1" min="0.2" @change="setSlippageLimits" required></b-form-input>
          </b-form-group>
        </div>
        <div class="border rounded text-center p-2"
          v-if="['removeConcLp', 'removeAmbLp'].includes(actionType) && poolFilled">
          <div v-if="poolValid">
            Approximate removed amounts:
            <br />
            {{ lpRemovedBaseTokens }} {{ tokens[action.base].symbol }}
            <br />
            {{ lpRemovedQuoteTokens }} {{ tokens[action.quote].symbol }}
          </div>
          <div v-else>
            Pool not found
          </div>
        </div>
      </div>
      <br />
      <b-form-checkbox id="checkbox-relayer" v-if="actionType" v-model="action._useRelayer" name="checkbox-relayer" switch size="lg" style="text-align: center;">
        Gasless <b-icon-question-circle id="gaslessQuestion" />
      </b-form-checkbox>
      <b-tooltip target="gaslessQuestion" triggers="hover">
        You'll have tip a relayer from your DEX balance
      </b-tooltip>
      <b-button type="submit" v-if="actionType" :variant="sendButtonVariant()" size="lg"
        style="width: 100%; margin-top: 0.5rem" :disabled="!canSign || signing">
        <div v-if="signing" class="load-spinner spinner-border spinner-border-md" role="status">
          <span class="sr-only">{{ action._useRelayer ? 'Signing...' : 'Sending' }}</span>
        </div>
        <div v-else-if="!signing">{{ action._useRelayer ? 'Sign' : 'Send' }}</div>
      </b-button>
    </b-form>
  </div>
</template>

<script>
import {
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormCheckbox,
  BFormInvalidFeedback,
  BIconArrowClockwise,
  BIconArrowDownShort,
  BIconQuestionCircle,
  BIconArrowDownUp,
  BIconArrowBarUp,
  BIconWallet2,
  BButton,
  BCollapse,
  BTooltip,
} from "bootstrap-vue";

import AddressInput from "./AddressInput.vue";
import CoinSelector from "./CoinSelector.vue"

import cloneDeep from "lodash.clonedeep";
import { parseUnits, formatUnits } from "viem"
import { fromDisplayPrice, encodeCrocPrice } from '@crocswap-libs/sdk'
import { getFormattedNumber } from "../number_formatting.jsx"
import { COMMANDS, SETTLE_FLAGS } from '../dex_actions.jsx'
import { isValidAddress, lpBaseTokens, lpQuoteTokens, poolKey } from '../utils.jsx'

export default {
  name: "ActionInput",
  components: {
    AddressInput,
    CoinSelector,
    BForm,
    BFormGroup,
    BFormInput,
    BFormSelect,
    BFormCheckbox,
    BFormInvalidFeedback,
    BFormInvalidFeedback,
    BIconArrowClockwise,
    BIconArrowDownUp,
    BIconArrowDownShort,
    BIconQuestionCircle,
    BIconArrowBarUp,
    BIconWallet2,
    BButton,
    BCollapse,
    BTooltip,
  },
  data: function () {
    return {
      action: { ...COMMANDS['swap'] },
      // action: { "_type": "swap", "text": "Swap", "base": null, "quote": null, "poolIdx": null, "isBuy": null, "qty": "1000000000", "tip": { "token": null, "amount": null }, "limitPrice": null, "minOut": "69", "settleFlags": 3, "_toToken": "0x0000000000000000000000000000000000000000", "_fromQty": "1000", "_fromQtyRaw": "1000000000", "_fromToken": "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", "_toQty": "0.520679069963617198", "_toQtyRaw": 0, "_slippage": 1, "_estimate": { "success": true, "output": "520679069963617198", "minOut": "515472279263981027", "priceAfter": "421011948436206964806132", "slipDirection": -1, "args": { "base": "0x0000000000000000000000000000000000000000", "quote": "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c", "poolIdx": 36000, "isBuy": false, "inBaseQty": false, "qty": "1000000000", "tip": 0, "limitPrice": "65537" } }, "_descripnion": "Unknown command", "_useRelayer": true, "_relayerAddr": null, "_relayManually": false, "_selectedRelayer": "bus", "_selectedTipToken": null, "_tipEstimates": { "null": { "text": "No estimate yet", "value": null, "amount": 0 } }, "_gasPrice": null, "_description": "Swap: 1,000.00 USDC for ETH" },
      swapDebouncer: 0,
      swapOutput: 0,
      swapPriceAfter: 0,
      invertSwapIcon: false,
      // actionType: swap,
      // action: { ...COMMANDS["removeConcLp"] },
      // actionType: "removeConcLp",
      COMMANDS,
      SETTLE_FLAGS
    };
  },
  emits: ['perform', 'fetchToken'],
  props: {
    pools: Object,
    tokens: Object,
    coldTokens: Object,
    balances: Object,
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
      this.$nextTick(() => { this.action = { ...action } })
      // all of these don't work:
      // this.action = Object.assign({}, this.action, {...action})
      // Object.assign(this.action, { ...action })
      // for (const [key, val] of Object.entries(action))
      //   this.$set(this.action, key, val)
    },
    hoverSwapIcon: function (isHovered) {
      this.invertSwapIcon = isHovered
    },
    // there has to be a way of handling potentially unknown decimals better
    reparseUnits: function (valueString, field, tokenAddress) {
      this.action[field] = parseUnits(valueString, this.tokens[tokenAddress].decimals)
    },
    setRecvToSelf: function () {
      this.action.recv = this.address
    },
    setWithdrawMax: function () {
      this.action._qtyRaw = this.balances[this.action.token].raw
      this.action.qty = this.balances[this.action.token].string
    },
    setSwapToMax: function (side) {
      if (side == 'from') {
        const balance = this.balances[this.action._fromToken]
        if (balance)
          this.action._fromQty = balance.string
        this.swapInputHandler(this.action._fromQty, 0)
      } else if (side == 'to') {
        const balance = this.balances[this.action._toToken]
        if (balance)
          this.action._toQty = balance.string
        this.swapInputHandler(0, this.action._toQty)
      }
    },
    swapInputHandler: function (qtyFrom, qtyTo) {
      // console.log(qtyFrom, typeof (qtyFrom))
      if (qtyFrom === '' || qtyTo === '') {
        this.action._fromQty = null
        this.action._toQty = null
        return
      }
      if (qtyFrom !== '' && qtyFrom <= 0) {
        this.action._toQty = null
        return
      }
      if (qtyTo !== '' && qtyFrom <= 0) {
        this.action._fromQty = null
        return
      }
      if (qtyFrom <= 0 && qtyTo <= 0) {
        return
      }
      if (!this.action._fromToken || !this.action._toToken)
        return
      if (qtyFrom > 0) {
        this.action._fromQtyRaw = parseUnits(qtyFrom, this.tokens[this.action._fromToken].decimals)
        this.action._toQty = '...'
        this.action._toQtyRaw = 0
      } else if (qtyTo > 0) {
        this.action._toQtyRaw = parseUnits(qtyTo, this.tokens[this.action._toToken].decimals)
        this.action._fromQty = '...'
        this.action._fromQtyRaw = 0
      } else {
        return
      }
      this.swapDebouncer += 1
      console.log('swapInput', this.swapDebouncer)
      if (this.swapDebouncer <= 1) {
        this.maybeGetSwapOutput(this.action._fromQtyRaw, this.action._toQtyRaw)
      } else {
        setTimeout(() => {
          this.swapDebouncer -= 1
          this.maybeGetSwapOutput(this.action._fromQtyRaw, this.action._toQtyRaw)
        }, 200)
      }
    },
    invertSwap: function () {
      console.log('inverting');
      [this.action._fromQty, this.action._toQty] = [this.action._toQty, this.action._fromQty];
      [this.action._fromToken, this.action._toToken] = [this.action._toToken, this.action._fromToken];
      this.swapInputHandler(this.action._fromQty, 0)
    },
    setSwapToken: function (side, address) {
      console.log('side', address, this.action._fromToken, this.action._toToken)
      if (side == 'from') {
        console.log('f', this.action._toToken == address)
        if (this.action._toToken == address)
          return
        this.action._fromQty = null
        this.action._fromToken = address
      } else if (side == 'to') {
        console.log('t', this.action._toToken == address)
        if (this.action._fromToken == address)
          return
        this.action._toQty = null
        this.action._toToken = address
      }
      this.maybeGetSwapOutput(this.action._fromQtyRaw, this.action._toQtyRaw)
    },
    maybeGetSwapOutput: async function (qtyFrom, qtyTo) {
      // console.log('maybeGet', this.swapDebouncer, qtyFrom, qtyTo)
      if (this.swapDebouncer > 1)
        return

      const swap = await this.fetchSwapOutput(this.action._fromToken, this.action._toToken, this.action.poolIdx, qtyFrom, qtyTo, this.action._slippage)
      console.log('swapOutput', swap)
      if (!swap.success) {
        this.swapError = 'Error while estimating swap'
        return
      }
      this.action._estimate = swap
      if (qtyFrom)
        this.action._toQty = formatUnits(swap.output, this.tokens[this.action._toToken].decimals)
      else
        this.action._fromQty = formatUnits(swap.output, this.tokens[this.action._fromToken].decimals)
    },
    setSlippageLimits: function () {
      const pool = this.pools[poolKey(this.action)]
      if (!pool)
        return
      // these are obviously swapped but that's the only way it works lmao
      const lowLimit = pool.price * (1 + this.action._slippage / 100)
      const highLimit = pool.price * (1 - this.action._slippage / 100)
      console.log(lowLimit, highLimit)

      const encodedLower = fromDisplayPrice(lowLimit, this.action._baseDecimals, this.action._quoteDecimals, true)
      this.action.limitLower = encodeCrocPrice(encodedLower).toString()
      const encodedHigher = fromDisplayPrice(highLimit, this.action._baseDecimals, this.action._quoteDecimals, true)
      this.action.limitHigher = encodeCrocPrice(encodedHigher).toString()
    },
    setSwapSlippage: function () {
      // this.action.minOut = this.action._estimate

    },
    describe: function () {
      const a = this.action;
      try {
        if (this.actionType == 'withdraw' || this.actionType == 'transfer') {
          const reformatted = formatUnits(a._qtyRaw, this.tokens[a.token].decimals)
          const amount = getFormattedNumber(parseFloat(reformatted))
          const shortRecv = `${a.recv.substring(0, 8)}…${a.recv.substring(36)}`;
          const subCmd = this.actionType == 'withdraw' ? 'Withdraw' : 'Transfer'
          a._description = `${subCmd}: ${amount} ${this.tokens[a.token].symbol} to ${shortRecv}`
        } else if (['removeConcLp', 'removeAmbLp'].indexOf(this.actionType) != -1) {
          const amtBase = `${this.lpRemovedBaseTokens} ${this.tokens[a.base].symbol}`
          const amtQuote = `${this.lpRemovedQuoteTokens} ${this.tokens[a.quote].symbol}`
          let dest = SETTLE_FLAGS.find(f => f.value == a.settleFlags).text
          dest = dest.charAt(0).toLowerCase() + dest.substring(1)
          a._description = `Remove LP: ${amtBase} + ${amtQuote} ${dest}`
        } else if (this.actionType == 'swap') {
          const reformatted = formatUnits(a._fromQtyRaw, this.tokens[a._fromToken].decimals)
          const qty = getFormattedNumber(parseFloat(reformatted))
          a._description = `Swap: ${qty} ${this.tokens[a._fromToken].symbol} for ${this.tokens[a._toToken].symbol}`
        } else {
          throw `Can't describe this action ${this.actionType}`
        }
      } catch (e) {
        console.error('describe error', e)
      }
    },
    perform: function (event) {
      event.preventDefault()
      this.describe()
      if (['removeConcLp', 'removeAmbLp'].indexOf(this.actionType) != -1)
        this.setSlippageLimits()
      else if (this.actionType == 'swap') {
        if (!this.action._estimate) {
          console.warn('no estimate for the swap')
          return
        }
        this.setSwapSlippage()
      }

      this.$emit('perform', this.action)
    },
    balanceHuman: function (tokenAddress) {
      const token = this.tokens[tokenAddress]
      const balance = this.balances[tokenAddress]
      if (!balance || !token)
        return '0.0'
      return balance.human
    },
    sendButtonVariant: function () {
      let color = this.action._useRelayer ? 'primary' : 'success'
      return this.signing ? `outline-${color}` : color
    },
  },
  computed: {
    actionType: {
      get: function () {
        return this.action._type
      },
      set: function (actionType) {
        this.action = cloneDeep(COMMANDS[actionType])
      }
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
        return lpBaseTokens(this.action, this.pools[poolKey(this.action)], this.action._qtyPct, true)
      else
        return 0
    },
    lpRemovedQuoteTokens: function () {
      if (this.poolValid)
        return lpQuoteTokens(this.action, this.pools[poolKey(this.action)], this.action._qtyPct, true)
      else
        return 0
    },
  },
  mounted: function () {
  },
  watch: {
  }
};

</script>

<style>
.form-group label {
  margin-bottom: 0.1rem;
}
</style>


