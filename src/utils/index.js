export function loadScript(url, onProgress) {
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

export async function loadScriptWithProgress(url, onProgress) {
    if (document.querySelector(`script[src="${url}"]`)) {
        onProgress && onProgress({ percent: 100, loaded: 0, total: 0 })
        return
    }
    
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to load script: ${url}`)
    }
    
    const contentEncoding = response.headers.get('content-encoding')
    const isCompressed = contentEncoding && contentEncoding.includes('gzip')
    
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    
    let loaded = 0
    const reader = response.body.getReader()
    const chunks = []
    
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value)
        loaded += value.length
        
        if (onProgress) {
            let percent = 0
            if (isCompressed) {
                percent = Math.min(99, Math.round((loaded / (total * 3)) * 100))
            } else if (total > 0) {
                percent = Math.round((loaded / total) * 100)
            }
            onProgress({ 
                percent, 
                loaded, 
                total: isCompressed ? loaded : total,
                isCompressed 
            })
        }
    }
    
    const blob = new Blob(chunks)
    const blobUrl = URL.createObjectURL(blob)
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = blobUrl
        script.onload = () => {
            URL.revokeObjectURL(blobUrl)
            onProgress && onProgress({ percent: 100, loaded, total: loaded })
            resolve()
        }
        script.onerror = () => {
            URL.revokeObjectURL(blobUrl)
            reject(new Error(`Failed to load script: ${url}`))
        }
        document.head.appendChild(script)
    })
}

export function formatSize(bytes) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
// VueOfficeExcel 转 vue-office-excel格式  .replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
 export function toCamalCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
 }

export async function loadOfficeComponent(type, onProgress) {
    if (import.meta.env.DEV) {
        if (type === 'xlsx' || type === 'xls') {
            const module = await import('@vue-office/excel')
            await import('@vue-office/excel/lib/index.css')
            // onProgress && onProgress(100)
            return module.default
        } else if (type === 'pdf') {
            const module = await import('@vue-office/pdf')
            // onProgress && onProgress(100)
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
        
        await loadScriptWithProgress(url, onProgress)
        
        const globalMap = {
            xlsx: 'VueOfficeExcel',
            xls: 'VueOfficeExcel',
            pdf: 'VueOfficePdf'
        }
        
        const globalName = globalMap[type]
        if (window[globalName]) {
            const component = window[globalName].default || window[globalName]
            if (window.appIns && !window.appIns.component[globalName]) {
                window.appIns.component(globalName, component)
                await sleep(100)
            }
            return globalName
        }
    }
    
    return null
}
