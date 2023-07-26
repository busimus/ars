<template>
  <div id="action-input">
    <br />
    <h4 style="text-align: center">
      Command input
    </h4>
    <b-form-select v-model="actionType" value-field="_type" :options="COMMANDS" @change="clearAction"></b-form-select>
    <b-form v-if="actionType" @submit="perform">
      <br />
      <div v-if="actionType == 'withdraw'">
        <b-form-group id="input-group-withdraw-recv" label="Recipient" label-for="input-withdraw-recv"
          description="Where tokens will be sent" required>
          <div style="display: flex; gap: 0.4rem">
            <b-form-input id="input-withdraw-recv" v-model="action.recv" placeholder="Address"
              :state="addressValid(action.recv)" required></b-form-input>
            <b-button variant="light" @click="setRecvToSelf"><b-icon-wallet-2 /></b-button>
          </div>
        </b-form-group>

        <b-form-group id="input-group-withdraw-token" label="Token contract" label-for="input-withdraw-token"
          description="Token contract address">
          <b-form-input id="input-withdraw-token" v-model="action.token" placeholder="Contract address"
            :state="addressValid(action.token)" required></b-form-input>
        </b-form-group>

        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-withdraw-qty" label="Amount to withdraw" label-for="input-withdraw-qty">
            <b-form-input id="input-withdraw-qty" v-model="action.qty" placeholder="0 to withdraw everything"
              @input="reparseUnits(action.qty, '_qtyRaw', action._qtyDecimals)" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-withdraw-qty-decimals" label="Decimals" label-for="input-withdraw-qty-decimals"
            style="width: min-content">
            <b-form-input id="input-withdraw-qty-decimals" v-model="action._qtyDecimals" placeholder="0" type="number"
              min=0 @change="reformatUnits(action._qtyRaw, 'qty', action._qtyDecimals)"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div v-if="actionType == 'transfer'">
        <b-form-group id="input-group-withdraw-recv" label="Recipient" label-for="input-withdraw-recv"
          description="Where DEX balance will be sent" required>
          <b-form-input id="input-withdraw-recv" v-model="action.recv" placeholder="Address"
            :state="addressValid(action.recv)" required></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-withdraw-token" label="Token contract" label-for="input-withdraw-token"
          description="Token contract address">
          <b-form-input id="input-withdraw-token" v-model="action.token" placeholder="Contract address"
            :state="addressValid(action.token)" required></b-form-input>
        </b-form-group>

        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-transfer-qty" label="Amount to transfer" label-for="input-transfer-qty">
            <b-form-input id="input-transfer-qty" v-model="action.qty" placeholder="0 to transfer everything"
              @input="reparseUnits(action.qty, '_qtyRaw', action._qtyDecimals)" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-transfer-qty-decimals" label="Decimals" label-for="input-transfer-qty-decimals"
            style="width: min-content">
            <b-form-input id="input-transfer-qty-decimals" v-model="action._qtyDecimals" placeholder="0" type="number"
              min=0 @change="reformatUnits(action._qtyRaw, 'qty', action._qtyDecimals)"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div v-else-if="actionType == 'removeConcLp' || actionType == 'removeAmbLp'">
        <div style="display: flex; gap: 0.4rem">
          <b-form-group id="input-group-removeLp-base" label="Base token" label-for="input-removeLp-base">
            <b-form-input id="input-removeLp-base" v-model="action.base" placeholder="Token address"
              :state="addressValid(action.base)" required></b-form-input>
          </b-form-group>
          <b-form-group id="input-group-removeLp-quote" label="Quote token" label-for="input-removeLp-quote">
            <b-form-input id="input-removeLp-quote" v-model="action.quote" placeholder="Token address"
              :state="addressValid(action.quote)" required></b-form-input>
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
        <div class="border rounded text-center p-2" v-if="actionFilled">
          Approximate removed amounts:
          <br />
          {{ lpRemovedBaseTokens }} {{ tokens[action.base].symbol }}
          <br />
          {{ lpRemovedQuoteTokens }} {{ tokens[action.quote].symbol }}
        </div>
      </div>
      <br />
      <b-form-checkbox id="checkbox-relayer" v-if="actionType" v-model="action._useRelayer" name="checkbox-relayer">
        Sign for gasless execution <b-icon-question-circle id="gaslessQuestion" />
      </b-form-checkbox>
      <b-tooltip target="gaslessQuestion" triggers="hover">
        You'll have tip a relayer or send the TX yourself from an address with gas
      </b-tooltip>
      <!--
    <b-form-group
      v-if="action._useRelayer === true"
      id="input-group-relayer-address"
      label="Relayer's address"
      label-for="input-relayer-address"
      description="Leave empty to not restrict to any address"
      style="margin-top: 0.5rem; margin-bottom: 0.5rem;"
    >
      <b-form-input
	id="input-relayer-address"
	v-model="action._relayerAddr"
	placeholder="Address of account or contract"
	@change="reformatUnits(action._qtyRaw, 'qty', action._qtyDecimals)"
	:state="addressValid(action._relayerAddr)"
      ></b-form-input>
    </b-form-group> -->
      <b-button type="submit" v-if="actionType" :variant="signing ? 'outline-primary' : 'primary'" size="lg"
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
  BIconQuestionCircle,
  BIconArrowBarUp,
  BIconWallet2,
  BButton,
  BCollapse,
  BTooltip,
} from "bootstrap-vue";

import { parseUnits, formatUnits } from "viem"
import { fromDisplayPrice, encodeCrocPrice } from '@crocswap-libs/sdk'
import { getFormattedNumber } from "../number_formatting.jsx"
import { COMMANDS, SETTLE_FLAGS } from '../dex_actions.jsx'
import { isValidAddress, lpBaseTokens, lpQuoteTokens, poolKey } from '../utils.jsx'

export default {
  name: "ActionInput",
  components: {
    BForm,
    BFormGroup,
    BFormInput,
    BFormSelect,
    BFormCheckbox,
    BFormInvalidFeedback,
    BFormInvalidFeedback,
    BIconArrowClockwise,
    BIconQuestionCircle,
    BIconArrowBarUp,
    BIconWallet2,
    BButton,
    BCollapse,
    BTooltip,
  },
  data: function () {
    return {
      action: { ...COMMANDS[null] },
      actionType: null,
      //action: {...COMMANDS.removeConcLp},
      //actionType: 'removeConcLp',
      COMMANDS,
      SETTLE_FLAGS
    };
  },
  props: {
    pools: Object,
    tokens: Object,
    address: String,
    signing: Boolean,
    canSign: Boolean,
  },
  methods: {
    setAction: function (action) {
      this.action = { ...action }
      this.actionType = action._type
    },
    clearAction: function () {
      this.action = { ...COMMANDS[this.actionType] }
    },
    addressValid(address) {
      if (address == null || address.length == 0) {
        return null;
      }
      if (address.length != 42) {
        return false;
      }
      return isValidAddress(address);
    },
    // there has to be a way of handling potentially unknown decimals better
    reformatUnits: function (value, field, decimals) {
      this.action[field] = formatUnits(value, decimals)
    },
    reparseUnits: function (valueString, field, decimals) {
      this.action[field] = parseUnits(valueString, decimals)
    },
    setRecvToSelf: function () {
      this.action.recv = this.address
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

      this.$emit('perform', this.action)
    },
  },
  computed: {
    actionFilled: function () {
      if (this.action.base && this.action.quote && this.action.qty)
        return true
      else
        return false
    },
    lpRemovedBaseTokens: function () {
      if (this.actionFilled)
        return lpBaseTokens(this.action, this.pools[poolKey(this.action)], this.action._qtyPct, true)
      else
        return 0
    },
    lpRemovedQuoteTokens: function () {
      if (this.actionFilled)
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


