import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import VueApexCharts from 'vue-apexcharts'

Vue.config.productionTip = false

Vue.use(Buefy)
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

new Vue({
    render: h => h(App),
}).$mount('#app')
