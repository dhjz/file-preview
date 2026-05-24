export function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve()
            return
        }
        
        const script = document.createElement('script')
        script.src = url
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
        document.head.appendChild(script)
    })
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
// VueOfficeExcel 转 vue-office-excel格式  .replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
 export function toCamalCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
 }

export async function loadOfficeComponent(type) {
    if (import.meta.env.DEV) {
        if (type === 'xlsx' || type === 'xls') {
            const module = await import('@vue-office/excel')
            await import('@vue-office/excel/lib/index.css')
            return module.default
        } else if (type === 'pdf') {
            const module = await import('@vue-office/pdf')
            return module.default
        }
    } else {
        const scriptMap = {
            xlsx: './lib/vue-office-excel.js',
            xls: './lib/vue-office-excel.js',
            pdf: './lib/vue-office-pdf.js'
        }
        
        const url = scriptMap[type]
        if (!url) return null
        
        await loadScript(url)
        
        const globalMap = {
            xlsx: 'VueOfficeExcel', // VueOfficeExcel vue-office-excel
            xls: 'VueOfficeExcel', // VueOfficeExcel vue-office-excel
            pdf: 'VueOfficePdf', // VueOfficePdf vue-office-pdf
        }
        
        const globalName = globalMap[type]
        if (window[globalName]) {
            const component = window[globalName].default || window[globalName]
            if (window.appIns && !window.appIns.component[globalName]) {
                window.appIns.component(globalName, component)
                await sleep(100)
                // return window.appIns.component(globalName)
            }
            return globalName
        }
    }
    
    return null
}
