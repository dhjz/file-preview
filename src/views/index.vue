<template>
    <div class="preview-container">
        <vue-office-docx
            v-if="fileType === 'docx'"
            :src="previewUrl"
            :options="docxOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
        <vue-office-excel
            v-else-if="fileType === 'xlsx' || fileType === 'xls'"
            :src="previewUrl"
            :options="excelOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
        <vue-office-pdf
            v-else-if="fileType === 'pdf'"
            :src="previewUrl"
            :options="pdfOptions"
            style="height: 100vh;"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
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
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import VueOfficePdf from '@vue-office/pdf'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
import { nextTick } from 'vue'

export default {
    name: 'IndexView',
    components: {
        VueOfficeDocx,
        VueOfficeExcel,
        VueOfficePdf
    },
    data() {
        return {
            fileType: '',
            fileUrl: '',
            inputUrl: '',
            inputProxy: '',
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
            
            this.parseOptions(params)
            console.log('this.fileType,', this.fileType);
            console.log('this.fileUrl,', this.fileUrl);
            console.log('this.pdfOptions,', this.pdfOptions);
            console.log('this.docxOptions,', this.docxOptions);
            console.log('this.excelOptions,', this.excelOptions);

            nextTick(() => console.log('this.previewUrl', this.previewUrl))

            let type = params.get('type')
            if (!type && this.fileUrl) {
                type = this.getFileTypeFromUrl(this.fileUrl)
            }
            this.fileType = type || ''
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
                xls: params.get('xls') === 'true',
                minColLength: params.get('minColLength') ? Number(params.get('minColLength')) : 0,
                minRowLength: params.get('minRowLength') ? Number(params.get('minRowLength')) : 0,
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
        }
    }
}
</script>

<style scoped>
.preview-container {
    width: 100%;
    height: 100vh;
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
</style>
