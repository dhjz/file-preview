<template>
    <div class="preview-container">
        <div v-if="currentComponent || fileType === 'docx'" class="action-buttons">
            <a :href="fileUrl" class="action-btn download" download target="_blank">下载</a>
            <div class="action-btn close" @click="closePage">关闭</div>
        </div>
        <div v-show="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">
                正在加载预览组件<span v-if="loadingTotal > 0">（{{ formatSize(loadingTotal) }}）</span>... {{ loadingProgress }}%
            </div>
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <div class="loading-tip">{{ loadTip }}</div>
        </div>
        <VueOfficeDocx
            v-if="fileType === 'docx'"
            :src="previewUrl"
            :options="options"
            :request-options="fetchOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
        <component
            v-else-if="currentComponent"
            :is="currentComponent"
            :src="previewUrl"
            :options="options"
            :request-options="fetchOptions"
            :staticFileUrl="staticFileUrl"
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
                    v-model.trim="inputProxy"
                    type="text"
                    class="url-input proxy-input"
                    placeholder="代理地址（可选，解决跨域）"
                />
            </div>
            <div class="input-area">
                <input
                    v-model.trim="inputUrl"
                    type="text"
                    class="url-input"
                    placeholder="请输入文件URL地址"
                    @keyup.enter="handlePreview"
                />
                <button class="preview-btn" @click="handlePreview">预览</button>
                <button class="preview-btn" @click="handlePreview(true)" title="信息放入sessionStorage">无痕预览</button>
            </div>
            <div class="tip">预览URL地址必须以http或https开头, 例如: <code>{{ lpath }}test.pdf</code></div>
            <div class="help-info">
                <p>支持的文件类型: <code>docx</code> <code>xlsx</code> <code>xls</code> <code>pdf</code></p>
                <p>URL参数: <code title="文件地址">url</code>(必传) <code title="文件类型">type</code>(可选) <code title="代理地址">proxy</code>(解决跨域)</p>
                <p>PDF: <code title="预览宽度">width</code> <code title="请求头">httpHeaders</code> <code title="加密密码">password</code></p>
                <p>DOCX: <code title="样式类名前缀">className</code> <code title="启用文档包装器">inWrapper</code> <code title="忽略页面宽度">ignoreWidth</code> <code title="忽略页面高度">ignoreHeight</code> <code title="启用分页">breakPages</code> <code title="调试模式">debug</code></p>
                <p>Excel: <code title="是否xls格式">xls</code> <code title="最少渲染列数">minColLength</code> <code title="最少渲染行数">minRowLength</code> <code title="宽度偏移量">widthOffset</code> <code title="高度偏移量">heightOffset</code></p>
                <p>高级选项(URL参数): <code title="直接传入渲染选项对象(JSON字符串,需URL encode 编码,优先级低于组件属性)">options</code> <code title="fetch请求配置对象(JSON字符串,需encode)">fetchOptions</code></p>
            </div>
        </div>
    </div>
</template>

<script>
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'
import { loadOfficeComponent, formatSize } from '@/utils'

export default {
    name: 'IndexView',
    components: {
        VueOfficeDocx
    },
    data() {
        const currPath = location.href.substring(0, location.href.lastIndexOf('/') + 1)
        return {
            fileType: '',
            loadTip: '',
            fileUrl: '',
            inputUrl: '',
            inputProxy: '',
            currentComponent: null,
            loading: false,
            loadingProgress: 0,
            loadingTotal: 0,
            fetchOptions: {},
            options: {},
            proxyUrl: window.proxyUrl || '',
            lpath: currPath,
            staticFileUrl: `${currPath}lib/`
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
        unsupportedFormat() {
            if (!this.fileUrl) return false
            const supportedFormats = ['docx', 'xlsx', 'xls', 'pdf']
            return this.fileType && !supportedFormats.includes(this.fileType)
        }
    },
    mounted() {
        this.parseUrlParams()
        console.log('this.staticFileUrl', this.staticFileUrl);
    },
    methods: {
        formatSize,
        parseUrlParams() {
            let params = Object.fromEntries(new URLSearchParams(location.search))
            this.fileUrl = (params.url || params.u || '').trim()
            if (!this.fileUrl && sessionStorage.getItem('preview_office')) {
                try {
                    let params = JSON.parse(sessionStorage.getItem('preview_office'))
                    this.fileUrl = (params.url || params.u || '').trim()
                } catch (e) {
                    console.warn('Failed to parse fetchOptions JSON:', e)
                } finally {
                    if (!location.hash.includes('preview')) {
                        sessionStorage.removeItem('preview_office')
                    }
                }
            }
            this.proxyUrl = (params.proxy || window.proxyUrl || '').trim()
            
            const cachedUrl = localStorage.getItem('preview_url') || ''
            const cachedProxy = localStorage.getItem('preview_proxy') || ''
            
            this.inputUrl = this.fileUrl || cachedUrl
            this.inputProxy = this.proxyUrl || cachedProxy
            
            let type = (params.type || '').trim()
            if (!type && this.fileUrl) {
                type = this.getFileTypeFromUrl(this.fileUrl)
            }
            this.fileType = type || ''
            
            this.parseOptions(params)

             this.parseFetchOptions(params)

             console.log('this.options', this.options);
             console.log('this.fetchOptions', this.fetchOptions);
             console.log('this.previewUrl', this.previewUrl, this.fileUrl);
            
            if (this.fileType && ['xlsx', 'xls', 'pdf'].includes(this.fileType)) {
                this.loadComponent(this.fileType)
            }
        },
        async loadComponent(type) {
            this.loading = true
            this.loadingProgress = 0
            this.loadingTotal = 0
            try {
                const component = await loadOfficeComponent(type, (progress) => {
                    this.loadingProgress = progress.percent
                    this.loadingTotal = progress.total
                })
                if (component) {
                    console.log('加载组件完成', type, component, this.previewUrl);
                    this.currentComponent = component
                }
            } catch (error) {
                console.error('加载组件失败:', error)
                this.loadTip = '加载组件失败，请检查网络连接或组件配置'
            } finally {
                this.loading = false
                this.loadingProgress = 0
                this.loadingTotal = 0
            }
        },
        getFileTypeFromUrl(url) {
            const match = url.match(/\.([a-z]+)(\?|$)/i)
            return match ? match[1].toLowerCase() : ''
        },
        parseOptions(params) {
            let jsonOptions = {}
            const optionsStr = params.options
            if (optionsStr) {
                try {
                    jsonOptions = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr
                } catch (e) {
                    console.warn('Failed to parse options JSON:', e)
                }
            }
            let manOptions = {
                // PDF 选项
                width: params.width ? Number(params.width) : undefined,
                httpHeaders: params.httpHeaders ? JSON.parse(params.httpHeaders) : {},
                password: params.password || '',
                // DOCX 选项
                className: params.className || 'docx',
                inWrapper: params.inWrapper !== 'false',
                ignoreWidth: params.ignoreWidth === 'true',
                ignoreHeight: params.ignoreHeight === 'true',
                ignoreFonts: params.ignoreFonts === 'true',
                breakPages: params.breakPages !== 'false',
                ignoreLastRenderedPageBreak: params.ignoreLastRenderedPageBreak === 'true',
                experimental: params.experimental === 'true',
                trimXmlDeclaration: params.trimXmlDeclaration !== 'false',
                useBase64URL: params.useBase64URL === 'true',
                useMathMLPolyfill: params.useMathMLPolyfill === 'true',
                showChanges: params.showChanges === 'true',
                debug: params.debug === 'true',
                // Excel 选项
                xls: this.fileType === 'xls' || params.xls === 'true',
                minColLength: params.minColLength ? Number(params.minColLength) : 26,
                minRowLength: params.minRowLength ? Number(params.minRowLength) : 200,
                widthOffset: params.widthOffset ? Number(params.widthOffset) : 10,
                heightOffset: params.heightOffset ? Number(params.heightOffset) : 10
            }
            this.options = { ...jsonOptions, ...manOptions }
        },
        parseFetchOptions(params) {
            const fetchOptionsStr = params.fetchOptions
            if (fetchOptionsStr) {
                try {
                    this.fetchOptions = typeof fetchOptionsStr === 'string' ? JSON.parse(fetchOptionsStr) : fetchOptionsStr
                } catch (e) {
                    console.warn('Failed to parse fetchOptions JSON:', e)
                }
            }
            const fetchOptionsKey = params.fetchOptionsKey || 'fetchOptionsKey'
            if (localStorage.getItem(fetchOptionsKey)) {
                try {
                    this.fetchOptions = JSON.parse(localStorage.getItem(fetchOptionsKey))
                } catch (e) {
                    console.warn('Failed to parse fetchOptions JSON:', e)
                }
            }
        },
        handlePreview(isPure) {
            if (!this.inputUrl) return
            localStorage.setItem('preview_url', this.inputUrl)
            localStorage.setItem('preview_proxy', this.inputProxy || '')
            
            const type = this.getFileTypeFromUrl(this.inputUrl)
            const proxy = this.inputProxy || ''
            if (isPure === true) {
                sessionStorage.setItem('preview_office', JSON.stringify({ url: this.inputUrl, type, proxy }))
                return window.open('#preview')
            }
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
        },
    }
}
</script>

<style scoped>
.preview-container {
    width: 100%;
    height: 100vh;
    position: relative;
}

.action-buttons {
    position: fixed;
    top: 10px;
    right: 30px;
    display: flex;
    gap: 12px;
    z-index: 1000;
    opacity: .8;
}

.action-btn {
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
}

.action-btn.download {
    color: #fff;
    background: #409eff;
}

.action-btn.close {
    color: #333;
    background: #ddd;
}


.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f5f7fa;
    z-index: 1000;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
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

.progress-bar {
    width: 300px;
    height: 6px;
    background: #e4e7ed;
    border-radius: 3px;
    margin-top: 12px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.loading-tip {
    margin-top: 12px;
    font-size: 14px;
    color: #ff4949;
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
