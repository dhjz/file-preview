import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

async function registerOfficeComponents() {
    if (import.meta.env.DEV) {
        const [excelModule, pdfModule] = await Promise.all([
            import('@vue-office/excel'),
            import('@vue-office/pdf')
        ])
        import('@vue-office/excel/lib/index.css')
        
        app.component('VueOfficeExcel', excelModule.default)
        app.component('VueOfficePdf', pdfModule.default)
    } else {
        if (window.VueOfficeExcel) {
            app.component('VueOfficeExcel', window.VueOfficeExcel.default || window.VueOfficeExcel)
        }
        if (window.VueOfficePdf) {
            app.component('VueOfficePdf', window.VueOfficePdf.default || window.VueOfficePdf)
        }
    }
}

registerOfficeComponents().then(() => {
    app.mount('#app')
})
