<template>
  <div id="exchangePositions">
    <div style="
       display: flex;
       align-items: center;
       justify-content: space-between;
     ">
      <button style="flex: 1; visibility: hidden">
        <b-icon-arrow-clockwise />
      </button>
      <h4 style="flex: 60" class="text-center">
        Exchange balances
      </h4>
      <b-button id="headerRefresh" style="flex: 1; margin-bottom: 0.5rem; border: 0px"
        @click="$emit('refresh')" title="Refresh DEX data">
        <b-icon-arrow-clockwise :class="{ 'icon-spin': refreshing > 0 }" />
      </b-button>
    </div>
    <div v-if="!address || (refreshing > 0 && !skeletoned && Object.keys(balances).length == 0)" style="display: flex;">
      <b-skeleton-table :animation="address ? undefined : null" :rows="3" :columns="4" hide-header
        :table-props="{ bordered: false, striped: true }"></b-skeleton-table>
    </div>
    <div v-else-if="(refreshing == 0 || skeletoned) && Object.keys(balances).length == 0" class="text-center">No balances found</div>
    <table id="tokenTable" v-else>
      <thead>
        <tr>
          <th>Symbol</th>
          <th scope="col">Address</th>
          <th scope="col">Balance</th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tr v-for="(balance, addr) in balances" v-if="balance.raw > 0n">
        <td>{{ tokens[addr].symbol }}</td>
        <td class="text-truncate" style="max-width: 0; padding-right: 0.4rem;">{{ addr }}</td>
        <td>{{ balance.human }}</td>
        <td>
          <a v-if="balance.raw > 0" @click.prevent="$emit('withdraw', addr)" href="#" title="Withdraw">
            <b-icon-arrow-bar-up />
          </a>
          <a v-if="balance.raw > 0" @click.prevent="$emit('transfer', addr)" href="#" style="margin-left: 0.7rem"
            title="Transfer">
            <small><b-icon-arrow-90deg-right /></small>
          </a>
        </td>
      </tr>
    </table>
    <br />
    <h4 class="text-center">
      Liquidity positions
    </h4>
    <div v-if="!address || (refreshing > 0 && !skeletoned && Object.keys(positions).length == 0)" style="display: flex;">
      <b-skeleton-table :animation="address ? undefined : null" :rows="3" :columns="3" hide-header
        :table-props="{ bordered: false, striped: true }"></b-skeleton-table>
    </div>
    <div v-else-if="(refreshing == 0 || skeletoned) && Object.keys(positions).length == 0" class="text-center">No positions found</div>
    <table v-else id="positionTable">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Amounts</th>
        </tr>
      </thead>
      <tr v-for="(pos, posId) in positions">
        <td>{{ pos.baseSymbol }}<br /> {{ pos.quoteSymbol }}</td>
        <td>{{ baseLpHumanAmount(pos) }}<br /> {{ quoteLpHumanAmount(pos) }}</td>
        <td>
          <a @click.prevent="$emit('removeLp', posId)" href="#" title="Remove">
            <b-icon-arrow-bar-up />
          </a>
        </td>
      </tr>
    </table>
    <!-- <table id="positionTable">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Amounts</th>
        </tr>
      </thead>
      <tr v-for="(pos, posId) in positions">
        <td>{{ pos.baseSymbol }}<br /> {{ pos.quoteSymbol }}</td>
        <td>{{ baseLpHumanAmount(pos) }}<br /> {{ quoteLpHumanAmount(pos) }}</td>
        <td>
          <a @click.prevent="$emit('removeLp', posId)" href="#" title="Remove">
            <b-icon-arrow-bar-up />
          </a>
        </td>
      </tr>
    </table>
    <table id="positionTable">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Amounts</th>
        </tr>
      </thead>
      <tr v-for="(pos, posId) in positions">
        <td>{{ pos.baseSymbol }}<br /> {{ pos.quoteSymbol }}</td>
        <td>{{ baseLpHumanAmount(pos) }}<br /> {{ quoteLpHumanAmount(pos) }}</td>
        <td>
          <a @click.prevent="$emit('removeLp', posId)" href="#" title="Remove">
            <b-icon-arrow-bar-up />
          </a>
        </td>
      </tr>
    </table>
    <table id="positionTable">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Amounts</th>
        </tr>
      </thead>
      <tr v-for="(pos, posId) in positions">
        <td>{{ pos.baseSymbol }}<br /> {{ pos.quoteSymbol }}</td>
        <td>{{ baseLpHumanAmount(pos) }}<br /> {{ quoteLpHumanAmount(pos) }}</td>
        <td>
          <a @click.prevent="$emit('removeLp', posId)" href="#" title="Remove">
            <b-icon-arrow-bar-up />
          </a>
        </td>
      </tr>
    </table> -->
  </div>
</template>

<script>
import {
  BButton,
  BFormInput,
  BFormInvalidFeedback,
  BIconQuestionCircle,
  BIconArrowClockwise,
  BIconArrowBarUp,
  BIconArrow90degRight,
  BCollapse,
  BTooltip,
  BSkeletonTable,
} from "bootstrap-vue";

import { ethers } from "ethers";
import { getFormattedNumber } from "../number_formatting.jsx"
import { lpBaseTokens, lpQuoteTokens, poolKey } from '../utils.jsx'

export default {
  name: "ExchangePositions",
  components: {
    BButton,
    BFormInput,
    BFormInvalidFeedback,
    BIconQuestionCircle,
    BIconArrowClockwise,
    BIconArrowBarUp,
    BIconArrow90degRight,
    BCollapse,
    BTooltip,
    BSkeletonTable,
  },
  data: function () {
    return {
      skeletoned: false, // one skeleton is enough skeletons
    };
  },
  props: {
    address: String,
    balances: Object,
    tokens: Object,
    positions: Object,
    pools: Object,
    refreshing: Number,
  },
  methods: {
    humanAmount: function (amount) {
      return getFormattedNumber(parseFloat(amount))
    },
    baseLpHumanAmount: function (pos) {
      const pool = this.pools[poolKey(pos)]
      if (!pool)
        return this.humanAmount(NaN)
      return lpBaseTokens(pos, pool, 100, true)
    },
    quoteLpHumanAmount: function (pos) {
      const pool = this.pools[poolKey(pos)]
      if (!pool)
        return this.humanAmount(NaN)
      return lpQuoteTokens(pos, pool, 100, true)
    },
  },
  computed: {
  },
  mounted: function () {
  },
  watch: {
    refreshing: function(newRefreshing, oldRefreshing) {
      if (newRefreshing == 0 && oldRefreshing == 1)
        this.skeletoned = true
    }
  }
};

</script>

<style scoped>
#tokenTable {
  width: 100%;
  border-collapse: collapse;
}

#positionTable {
  width: 100%;
  border-collapse: collapse;
}

td {
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
}

#tokenTable tr {
  border-bottom: 1px solid #d3d3d3;
}

#positionTable tr {
  border-bottom: 1px solid #d3d3d3;
}

#headerRefresh {
  width: auto;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  background:none;
}

#headerRefresh:focus {
  box-shadow: 0px 0px 2px lightgrey;
}
</style>

