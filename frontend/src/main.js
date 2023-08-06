import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { ModalPlugin, VBTogglePlugin, ToastPlugin, VBHoverPlugin } from "bootstrap-vue";

import Vue from "vue";

import App from "./App.vue";

Vue.config.productionTip = false;
Vue.use(ModalPlugin);
Vue.use(VBTogglePlugin);
Vue.use(ToastPlugin);
Vue.use(VBHoverPlugin)

import * as Sentry from "@sentry/vue";
Sentry.init({
  Vue,
  dsn: "https://aa5166250d64b1f75ef3859089fef95d@o4505626674855936.ingest.sentry.io/4505626676101121",
  tunnel: "https://ars.bus.bz/sen",
  ignoreErrors: [/WebSocket connection failed/i, /RPC Request failed/i, /Already processing eth_requestAccounts/i, /Requested resource not available/i],
  beforeBreadcrumb: function (bc, hint) {
    // returning null to not send any additional data for privacy reasons
    return null
  },
  // beforeSend: function (event, hint) {
  //   const error = hint.originalException;
  //   console.log(event, hint, error)
  //   if (error && error.message && error.message.match(/WebSocket connection failed/i)) {
  //     return null
  //   }
  //   return event;
  // },
});


var vm = new Vue({ render: (h) => h(App) });
vm.$mount("#app");
