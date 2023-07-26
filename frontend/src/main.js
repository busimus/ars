import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { ModalPlugin, VBTogglePlugin, ToastPlugin } from "bootstrap-vue";

import Vue from "vue";

import App from "./App.vue";

Vue.config.productionTip = false;
Vue.use(ModalPlugin);
Vue.use(VBTogglePlugin);
Vue.use(ToastPlugin);

var vm = new Vue({ render: (h) => h(App) });
vm.$mount("#app");
