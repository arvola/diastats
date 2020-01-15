import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import VueApexCharts from 'vue-apexcharts'
import Bluebird from 'bluebird';

Bluebird.config({
    longStackTraces: true,
    warnings: true
});

(window as any).Promise = Bluebird;

Vue.config.productionTip = false

Vue.use(Buefy)
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

Promise.longStackTraces();

new Vue({
    render: h => h(App),
}).$mount('#app')
