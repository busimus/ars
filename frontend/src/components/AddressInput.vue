<template>
  <b-form-group :id="'input-group-' + name" :label="label" :label-for="'input-' + name" required style="width: 100%">
    <!-- buncha dumb bullshit needed to get prop updating to work here -->
    <b-form-input :id="'input-' + name" :value="address" @input="$emit('update:address', $event)" :placeholder="placeholder" :state="inputValid"
      required></b-form-input>
    <small v-if="description && tokenString == null" class="form-text text-muted">{{ description }}</small>
    <b-form-valid-feedback v-if="isToken && tokenValid" :id="'input-' + name + 'valid-feedback'">
      Token: {{ tokenString }}
    </b-form-valid-feedback>
    <b-form-invalid-feedback v-if="(isToken && tokenValid == false) || (isToken != true && tokenValid == true)"
      :id="'input-' + name + 'invalid-feedback'">
      {{ tokenString }}
    </b-form-invalid-feedback>
  </b-form-group>
</template>

<script>
import {
  BForm,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BFormValidFeedback,
} from "bootstrap-vue";

import { isValidAddress } from '../utils.jsx'

export default {
  name: "AddressInput",
  components: {
    BForm,
    BFormGroup,
    BFormInvalidFeedback,
    BFormValidFeedback,
    BFormInput,
  },
  data: function () {
    return {
    };
  },
  emits: ['update:address'],
  props: {
    name: String,
    address: String,
    label: String,
    description: String,
    placeholder: String,
    isToken: Boolean,
    tokens: Object,
  },
  methods: {

  },
  computed: {
    inputValid: function () {
      if (this.addressValid == false)
        return false
      if (this.isToken == true && this.addressValid == true && !this.tokenValid)
        return false
      if (this.isToken != true && this.tokenValid)
        return false
      return this.addressValid
    },
    addressValid: function () {
      if (this.address == null || this.address.length == 0) {
        return null;
      }
      if (this.address.length != 42) {
        return false;
      }
      return isValidAddress(this.address);
    },
    tokenValid: function () {
      if (!this.addressValid)
        return null
      return this.tokens.hasOwnProperty(this.address)
    },
    tokenString: function () {
      if (!this.addressValid)
        return null

      const token = this.tokens[this.address]
      if (!token && this.isToken) {
        this.$emit('fetchToken', this.address)
        return "Unknown token!"
      } else if (token) {
        if (this.isToken != true)
          return `This is the token address for ${token.symbol}!`
        else
          return token.symbol
      }
      return null
    }
  }
}

</script>


<style scoped>
</style>
