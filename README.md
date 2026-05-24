# Vue3 文档预览组件演示

基于 Vue 3 的在线文档预览解决方案，支持 Word、Excel、PDF 等多种文档格式的在线预览。

# 其他说明
- 页面效果图见`appimg`目录
- <img src="https://gcore.jsdelivr.net/gh/dhjz/file-preview@main/appimg/app1.jpg" style="width: 340px;"/>
- <img src="https://gcore.jsdelivr.net/gh/dhjz/file-preview@main/appimg/app2.jpg" style="width: 340px;"/>

- 项目地址: [https://github.com/dhjz/file-preview]( https://github.com/dhjz/file-preview)  
- 预览地址: [https://dhjz.github.io/file-preview/](https://dhjz.github.io/file-preview/)

## 支持的文件格式

- **Word 文档**: `.docx`
- **Excel 表格**: `.xlsx`, `.xls`
- **PDF 文档**: `.pdf`

## 技术栈

- Vue 3.2+
- Vue Router 4
- Vite 5
- [@vue-office/docx](https://github.com/501351981/vue-office)
- [@vue-office/excel](https://github.com/501351981/vue-office)
- [@vue-office/pdf](https://github.com/501351981/vue-office)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 构建库文件

将 Excel 和 PDF 预览组件打包为独立的 IIFE 格式文件：

```bash
npm run buildlib
```

构建后的文件将输出到 `public/lib/` 目录：
- `vue-office-excel.js` - Excel 预览组件
- `vue-office-pdf.js` - PDF 预览组件

## 使用方法

### 方式一：URL 参数预览

访问页面时通过 URL 参数传递文件地址：

```
http://localhost:5173/?url=https://example.com/test.pdf
```

### 方式二：页面输入预览

直接访问页面，在输入框中输入文件 URL 地址，点击"预览"按钮。

## URL 参数说明

### 基础参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `url` | string | 是 | 文件地址（必须以 http 或 https 开头） |
| `type` | string | 否 | 文件类型（不传时自动识别） |
| `proxy` | string | 否 | 代理地址（用于解决跨域问题） |

### PDF 参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `width` | number | 预览宽度 |
| `httpHeaders` | object | 请求头（JSON 字符串） |
| `password` | string | 加密密码 |

### DOCX 参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `className` | string | 'docx' | 样式类名前缀 |
| `inWrapper` | boolean | true | 启用文档包装器 |
| `ignoreWidth` | boolean | false | 忽略页面宽度 |
| `ignoreHeight` | boolean | false | 忽略页面高度 |
| `ignoreFonts` | boolean | false | 忽略字体 |
| `breakPages` | boolean | true | 启用分页 |
| `ignoreLastRenderedPageBreak` | boolean | false | 忽略最后渲染的分页符 |
| `experimental` | boolean | false | 实验性功能 |
| `trimXmlDeclaration` | boolean | true | 移除 XML 声明 |
| `useBase64URL` | boolean | false | 使用 Base64 URL |
| `useMathMLPolyfill` | boolean | false | 使用 MathML 填充 |
| `showChanges` | boolean | false | 显示更改 |
| `debug` | boolean | false | 调试模式 |

### Excel 参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `xls` | boolean | false | 是否为 xls 格式 |
| `minColLength` | number | 26 | 最少渲染列数 |
| `minRowLength` | number | 200 | 最少渲染行数 |
| `widthOffset` | number | 10 | 宽度偏移量 |
| `heightOffset` | number | 10 | 高度偏移量 |

## 使用示例

### 预览 PDF 文件

```
http://localhost:5173/?url=https://example.com/document.pdf
```

### 预览 Excel 文件并设置参数

```
http://localhost:5173/?url=https://example.com/data.xlsx&minColLength=30&minRowLength=500
```

### 使用代理解决跨域

```
http://localhost:5173/?url=https://example.com/file.pdf&proxy=https://your-proxy.com/api/proxy?url=
```

### 预览加密的 PDF

```
http://localhost:5173/?url=https://example.com/protected.pdf&password=123456
```

## 项目结构

```
vueoffice-demo-vue3/
├── bin/
│   └── buildLib.js          # 库文件构建脚本
├── public/
│   ├── lib/                 # 构建后的库文件
│   │   ├── vue-office-excel.js
│   │   ├── vue-office-pdf.js
│   │   ├── vue.global.prod.js
│   │   └── vuedemi.iife.min.js
│   ├── test.docx            # 测试文件
│   ├── test.pdf
│   └── test.xlsx
├── src/
│   ├── components/          # 组件目录
│   ├── views/
│   │   └── index.vue        # 主预览页面
│   ├── App.vue
│   ├── main.js
│   └── routes.js
├── package.json
└── vite.config.js
```

## 构建脚本说明

`bin/buildLib.js` 用于将 `@vue-office/excel` 和 `@vue-office/pdf` 打包成独立的 IIFE 格式文件，便于在非模块化环境中使用。

### 构建流程

1. 创建临时入口文件和 Vite 配置
2. 使用 Vite 构建库文件
3. 将构建产物复制到 `public/lib/` 目录
4. 清理临时文件

### 配置说明

构建脚本支持以下配置：

```javascript
const libs = [
  {
    name: 'excel',
    package: '@vue-office/excel',
    globalName: 'VueOfficeExcel',
    outputFile: 'vue-office-excel.js',
    css: '@vue-office/excel/lib/index.css'
  },
  {
    name: 'pdf',
    package: '@vue-office/pdf',
    globalName: 'VueOfficePdf',
    outputFile: 'vue-office-pdf.js',
    css: ''
  }
]
```

- `name`: 库标识名称
- `package`: npm 包名
- `globalName`: 全局变量名
- `outputFile`: 输出文件名
- `css`: CSS 文件路径（可选）

## 注意事项

1. **跨域问题**: 如果文件服务器不允许跨域访问，可以使用 `proxy` 参数指定代理地址
2. **文件格式**: 确保文件 URL 可以直接访问，且文件格式正确
3. **浏览器兼容**: 建议使用现代浏览器（Chrome、Firefox、Edge、Safari）
4. **文件大小**: 大文件可能需要较长加载时间，请耐心等待

## 相关资源

- [vue-office 官方文档](https://github.com/501351981/vue-office)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)

## License

MIT
