<template>
    <div class="preview-container">
        <VueOfficeDocx
            v-if="fileType === 'docx'"
            :src="previewUrl"
            :options="docxOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
        <div v-else-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在加载预览组件...</div>
        </div>
        <component
            v-else-if="currentComponent"
            :is="currentComponent"
            :src="previewUrl"
            :options="currentOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
        <div v-else-if="unsupportedFormat" class="unsupported-format">
            <div class="unsupported-content">
                <div class="unsupported-icon">⚠️</div>
                <div class="unsupported-text">当前格式不支持在线预览, 请下载文件到本地打开</div>
                <a :href="fileUrl" class="download-link" download target="_blank">点击下载文件</a>
                <button class="close-btn" @click="closePage">关闭当前页面</button>
            </div>
        </div>
        <div v-else class="no-preview">
            <div class="input-area">
                <input
                    v-model="inputProxy"
                    type="text"
                    class="url-input proxy-input"
                    placeholder="代理地址（可选，解决跨域）"
                />
            </div>
            <div class="input-area">
                <input
                    v-model="inputUrl"
                    type="text"
                    class="url-input"
                    placeholder="请输入文件URL地址"
                    @keyup.enter="handlePreview"
                />
                <button class="preview-btn" @click="handlePreview">预览</button>
            </div>
            <div class="tip">预览URL地址必须以http或https开头, 例如: <code>{{ lpath }}test.pdf</code></div>
            <div class="help-info">
                <p>支持的文件类型: <code>docx</code> <code>xlsx</code> <code>xls</code> <code>pdf</code></p>
                <p>URL参数: <code title="文件地址">url</code>(必传) <code title="文件类型">type</code>(可选) <code title="代理地址">proxy</code>(解决跨域)</p>
                <p>PDF: <code title="预览宽度">width</code> <code title="请求头">httpHeaders</code> <code title="加密密码">password</code></p>
                <p>DOCX: <code title="样式类名前缀">className</code> <code title="启用文档包装器">inWrapper</code> <code title="忽略页面宽度">ignoreWidth</code> <code title="忽略页面高度">ignoreHeight</code> <code title="启用分页">breakPages</code> <code title="调试模式">debug</code></p>
                <p>Excel: <code title="是否xls格式">xls</code> <code title="最少渲染列数">minColLength</code> <code title="最少渲染行数">minRowLength</code> <code title="宽度偏移量">widthOffset</code> <code title="高度偏移量">heightOffset</code></p>
            </div>
        </div>
    </div>
</template>

<script>
import { shallowRef } from 'vue'
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'

// const componentMap = {
//     xlsx: async () => {
//         await import('@vue-office/excel/lib/index.css')
//         return import('@vue-office/excel').then(m => m.default)
//     },
//     xls: async () => {
//         await import('@vue-office/excel/lib/index.css')
//         return import('@vue-office/excel').then(m => m.default)
//     },
//     pdf: () => import('@vue-office/pdf').then(m => m.default)
// }

export default {
    name: 'IndexView',
    components: {
        VueOfficeDocx
    },
    data() {
        return {
            fileType: '',
            fileUrl: '',
            inputUrl: '',
            inputProxy: '',
            currentComponent: shallowRef(null),
            loading: false,
            pdfOptions: {},
            docxOptions: {},
            excelOptions: {
                xls: false,
                minColLength: 0,
                minRowLength: 0,
                widthOffset: 10,
                heightOffset: 10
            },
            proxyUrl: window.proxyUrl || '',
            lpath: location.href.substring(0, location.href.lastIndexOf('/') + 1),
        }
    },
    computed: {
        previewUrl() {
            if (!this.fileUrl) return ''
            if (this.proxyUrl) {
                return this.proxyUrl + encodeURIComponent(this.fileUrl)
            }
            return this.fileUrl
        },
        currentOptions() {
            const optionsMap = {
                docx: this.docxOptions,
                xlsx: this.excelOptions,
                xls: this.excelOptions,
                pdf: this.pdfOptions
            }
            return optionsMap[this.fileType] || {}
        },
        unsupportedFormat() {
            if (!this.fileUrl) return false
            const supportedFormats = ['docx', 'xlsx', 'xls', 'pdf']
            return this.fileType && !supportedFormats.includes(this.fileType)
        }
    },
    mounted() {
        this.parseUrlParams()
    },
    methods: {
        parseUrlParams() {
            const params = new URLSearchParams(window.location.search)
            this.fileUrl = params.get('url') || ''
            this.proxyUrl = params.get('proxy') || window.proxyUrl || ''
            
            const cachedUrl = localStorage.getItem('preview_url') || ''
            const cachedProxy = localStorage.getItem('preview_proxy') || ''
            
            this.inputUrl = this.fileUrl || cachedUrl
            this.inputProxy = this.proxyUrl || cachedProxy
            
            let type = params.get('type')
            if (!type && this.fileUrl) {
                type = this.getFileTypeFromUrl(this.fileUrl)
            }
            this.fileType = type || ''
            
            this.parseOptions(params)
            
            if (this.fileType && ['xlsx', 'xls', 'pdf'].includes(this.fileType)) {
                this.loadComponent(this.fileType)
            }
        },
        loadComponent(type) {
            this.loading = true
            const componentMap = {
                xlsx: 'VueOfficeExcel',
                xls: 'VueOfficeExcel',
                pdf: 'VueOfficePdf'
            }
            const componentName = componentMap[type]
            if (componentName) {
                this.currentComponent = shallowRef(this.$options.components[componentName] || componentName)
                this.loading = false
            }
        },
        getFileTypeFromUrl(url) {
            const match = url.match(/\.([a-z]+)(\?|$)/i)
            return match ? match[1].toLowerCase() : ''
        },
        parseOptions(params) {
            this.pdfOptions = {
                width: params.get('width') ? Number(params.get('width')) : undefined,
                httpHeaders: params.get('httpHeaders') ? JSON.parse(params.get('httpHeaders')) : {},
                password: params.get('password') || ''
            }
            
            this.docxOptions = {
                className: params.get('className') || 'docx',
                inWrapper: params.get('inWrapper') !== 'false',
                ignoreWidth: params.get('ignoreWidth') === 'true',
                ignoreHeight: params.get('ignoreHeight') === 'true',
                ignoreFonts: params.get('ignoreFonts') === 'true',
                breakPages: params.get('breakPages') !== 'false',
                ignoreLastRenderedPageBreak: params.get('ignoreLastRenderedPageBreak') === 'true',
                experimental: params.get('experimental') === 'true',
                trimXmlDeclaration: params.get('trimXmlDeclaration') !== 'false',
                useBase64URL: params.get('useBase64URL') === 'true',
                useMathMLPolyfill: params.get('useMathMLPolyfill') === 'true',
                showChanges: params.get('showChanges') === 'true',
                debug: params.get('debug') === 'true'
            }
            
            this.excelOptions = {
                xls: this.fileType === 'xls' || params.get('xls') === 'true',
                minColLength: params.get('minColLength') ? Number(params.get('minColLength')) : 26,
                minRowLength: params.get('minRowLength') ? Number(params.get('minRowLength')) : 200,
                widthOffset: params.get('widthOffset') ? Number(params.get('widthOffset')) : 10,
                heightOffset: params.get('heightOffset') ? Number(params.get('heightOffset')) : 10
            }
        },
        handlePreview() {
            if (!this.inputUrl) return
            localStorage.setItem('preview_url', this.inputUrl)
            localStorage.setItem('preview_proxy', this.inputProxy || '')
            
            const type = this.getFileTypeFromUrl(this.inputUrl)
            const url = new URL(window.location.href)
            url.searchParams.set('url', this.inputUrl)
            if (this.inputProxy) {
                url.searchParams.set('proxy', this.inputProxy)
            }
            window.open(url.toString())
        },
        renderedHandler() {
            console.log('渲染完成')
        },
        errorHandler() {
            console.log('渲染失败')
        },
        closePage() {
            window.close()
        }
    }
}
</script>

<style scoped>
.preview-container {
    width: 100%;
    height: 100vh;
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f5f7fa;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e4e7ed;
    border-top-color: #409eff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    margin-top: 16px;
    font-size: 14px;
    color: #606266;
}

.no-preview {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: #f5f7fa;
}

.tip {
    font-size: 14px;
    color: #909399;
    margin-bottom: 10px;
}

.input-area {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.proxy-input {
    width: 534px;
}

.url-input {
    width: 450px;
    height: 40px;
    padding: 0 14px;
    font-size: 14px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s;
}

.url-input:focus {
    border-color: #409eff;
}

.url-input::placeholder {
    color: #c0c4cc;
}

.preview-btn {
    height: 40px;
    padding: 0 24px;
    font-size: 14px;
    color: #fff;
    background: #409eff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.preview-btn:hover {
    background: #66b1ff;
}

.help-info {
    font-size: 13px;
    color: #909399;
    text-align: center;
    line-height: 1.8;
}

.help-info code {
    padding: 2px 6px;
    font-size: 12px;
    background: #e9e9eb;
    border-radius: 3px;
    color: #606266;
}

.unsupported-format {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f5f7fa;
}

.unsupported-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 60px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.unsupported-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.unsupported-text {
    font-size: 18px;
    color: #303133;
    margin-bottom: 24px;
}

.download-link {
    display: inline-block;
    padding: 12px 32px;
    font-size: 14px;
    color: #fff;
    background: #409eff;
    border-radius: 4px;
    text-decoration: none;
    margin-bottom: 16px;
    transition: background 0.2s;
}

.download-link:hover {
    background: #66b1ff;
}

.close-btn {
    padding: 10px 28px;
    font-size: 14px;
    color: #606266;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.close-btn:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background: #ecf5ff;
}
</style>
