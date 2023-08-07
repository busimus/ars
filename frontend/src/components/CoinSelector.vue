<template>
  <div>
    <label v-if="label" class="d-block" style="margin-bottom: 0.1rem;">{{ label }}</label>
    <b-button class="input-like" @click="openTokenModal"
      style="padding-left: 0.5rem; padding-right: 0.5rem; width: 100%; min-width: 6rem;">
      <div v-if="tokenValid" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
        <b-avatar size="sm" v-if="token.logoURI" :src="token.logoURI" icon="coin" text="..."></b-avatar>
        <div>{{ token.symbol }}</div>
      </div>
      <div v-else>
        Select
      </div>
    </b-button>
    <b-form-checkbox v-if="surplusDirection" :checked="useSurplus" @change="v => { $emit('update:useSurplus', v) }" name="checkbox-use-surplus" switch size="sm" style="margin-top: 0.25rem; margin-left: 0.15rem;">
      <span v-if="surplusDirection == 'to'">
        {{ useSurplus ? 'To DEX' : 'To wallet' }}
      </span>
      <span v-else-if="surplusDirection == 'from'">
        {{ useSurplus ? 'Wallet+DEX' : 'Only wallet' }}
      </span>
    </b-form-checkbox>

    <b-modal ref="token-modal" title="Select token" scrollable hide-footer centered
      @shown="e => { this.modalShown = true; this.$refs['token-input-line'].focus(); }"
      @hidden="e => { this.modalShown = false }">
      <b-form-input ref="token-input-line" v-model="inputString" placeholder="Enter token name or address"
        @input="maybeFetchToken"></b-form-input>
      <div id="token-list" class="mt-2" v-if="modalShown">
        <table class="table table-hover" style="width: 100%">
          <tbody>
            <tr v-for="token in tokenList">
              <td variant="outline-dark" @click="selectToken(token.address)"
                style="padding: 0.5rem; display: flex; gap: 0.5rem; align-content: space-between; width: 100%;">
                <b-avatar size="sm" :src="token.logoURI ? token.logoURI : null"
                  :text="token.symbol.substr(0, 1)"></b-avatar>
                <div>{{ token.symbol }} – {{ token.name }}</div>
                <div style="margin-left: auto">{{ balanceHuman(token.address) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </b-modal>
  </div>
</template>

<script>

import {
  BAvatar,
  BFormCheckbox,
  BFormValidFeedback,
  BFormInvalidFeedback,
  BFormInput,
  BButton,
  BModal,
} from "bootstrap-vue";

import { isValidAddress } from '../utils.jsx'

const TOKEN_LIST_LIMIT = 50

export default {
  name: "CoinSelector",
  components: {
    BAvatar,
    BFormCheckbox,
    BFormValidFeedback,
    BFormInvalidFeedback,
    BFormInput,
    BButton,
  },
  data: function () {
    return {
      inputString: '',
      modalShown: false,
    };
  },
  emits: ['update:address', 'update:useSurplus', "fetchToken"],
  props: {
    address: String,
    tokens: Object,
    cold_tokens: Object,
    balances: Object,
    label: String,
    surplusDirection: String,
    useSurplus: Boolean,
  },
  methods: {
    maybeFetchToken: function () {
      if (this.addressValid(this.inputString)) {
        console.log('emiting fetchToken')
        this.$emit('fetchToken', this.inputString)
      }
    },
    selectToken: function (address) {
      // this.address = address
      this.$emit('update:address', address)
      this.$emit('fetchToken', address)
      this.$refs['token-modal'].hide()
    },
    openTokenModal: function () {
      this.inputString = null
      this.$refs['token-modal'].show()
    },
    addressValid: function (address) {
      if (address == null || address.length == 0) {
        return null
      }
      if (address.length != 42) {
        return false
      }
      return isValidAddress(address)
    },
    balanceHuman: function (tokenAddress) {
      const token = this.tokens[tokenAddress]
      const balance = this.balances[tokenAddress]
      if (!balance || !token)
        return ''
      return balance.human
    },
  },
  computed: {
    tokenValid: function () {
      if (!this.addressValid(this.address))
        return null
      return this.tokens.hasOwnProperty(this.address)
    },
    token: function () {
      const token = this.tokens[this.address]
      return token ? token : this.cold_tokens[this.address]
    },
    tokenList: function () {
      let tokensFirst = []
      let tokens = []
      const addedTokens = {} // for deduplication
      const input = (this.inputString || '').toLowerCase()


      if (!input) {
        tokensFirst = Object.values(this.tokens)
      } else if (this.addressValid(input) == true) {
        let token = this.tokens[input]
        if (token)
          return [token]
        token = this.cold_tokens[input]
        if (token)
          return [token]
        return []
      } else {
        for (const arr of [Object.values(this.tokens), Object.values(this.cold_tokens) || []]) {
          for (const token of arr) {
            if (addedTokens.hasOwnProperty(token.address)) {
              console.log(token.symbolLower)
            } else if (token.symbolLower.startsWith(input) || token.symbolLower == input) {
              if ((tokens.length + tokensFirst.length) < TOKEN_LIST_LIMIT) {
                tokensFirst.push(token)
                addedTokens[token.address] = null
              }
            } else if (token.symbolLower.indexOf(input) != -1 || token.nameLower.indexOf(input) != -1) {
              if ((tokens.length + tokensFirst.length) < TOKEN_LIST_LIMIT) {
                tokens.push(token)
                addedTokens[token.address] = null
              }
            }
          }
        }
      }
      const balances = this.balances
      tokensFirst = tokensFirst.sort(function (a, b) {
        const balDiff = (balances[a.address] || 0) - (balances[b.address] || 0)
        if (balDiff != 0) return balDiff
        if (a.symbol < b.symbol) return -1
        if (a.symbol > b.symbol) return 1
        return 0
      })
      tokensFirst = tokensFirst.concat(tokens)
      return tokensFirst
    }
  },
  watch: {
    address: function (newAddress) {
      if (newAddress)
        this.$emit('fetchToken', newAddress)
    }
  }
}
</script>

<style scoped>
</style>
