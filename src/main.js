import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

if (window.VueOfficeExcel) {
  app.component('VueOfficeExcel', window.VueOfficeExcel.default || window.VueOfficeExcel)
}

if (window.VueOfficePdf) {
  app.component('VueOfficePdf', window.VueOfficePdf.default || window.VueOfficePdf)
}

app.mount('#app')
