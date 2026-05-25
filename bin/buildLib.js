import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const originalCwd = process.cwd()

const tempDir = path.join(rootDir, '.temp-build')
const libDir = path.join(rootDir, 'public/lib')

const allLibs = [
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
  },
  {
    name: 'ofd',
    package: '@vue-office/ofd',
    importPath: '../components/ofd/index.js',
    globalName: 'VueOfficeOfd',
    outputFile: 'vue-office-ofd.js',
    css: ''
  }
]

function parseArgs() {
  const args = process.argv.slice(2)
  const result = { libs: [] }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--lib=')) {
      const libNames = arg.slice(6).split(',').map(n => n.trim())
      result.libs = libNames
    } else if (arg === '--lib' && i + 1 < args.length) {
      const libNames = args[i + 1].split(',').map(n => n.trim())
      result.libs = libNames
      i++
    } else if (!arg.startsWith('--')) {
      result.libs.push(arg)
    }
  }
  
  return result
}

function getTargetLibs() {
  const args = parseArgs()
  
  if (args.libs.length === 0) {
    return allLibs
  }
  
  const targetLibs = args.libs.map(libName => {
    const found = allLibs.find(lib => lib.name === libName)
    if (!found) {
      console.error(`❌ 未找到库: ${libName}`)
      console.log(`可用的库: ${allLibs.map(l => l.name).join(', ')}`)
      process.exit(1)
    }
    return found
  })
  
  return targetLibs
}

function getEntryContent(lib) {
  const cssImport = lib.css ? `import '${lib.css}'\n` : ''
  const importPath = lib.importPath || lib.package
  return `import ${lib.globalName} from '${importPath}'
${cssImport}
export default ${lib.globalName}
`
}

function getViteConfigContent(lib, isFirst) {
  const plugins = lib.css
    ? `[
    vue(),
    cssInjectedByJsPlugin({
      relativeCSSInjection: true
    })
  ]`
    : `[vue(),
    cssInjectedByJsPlugin({
      relativeCSSInjection: true
    })]`

  return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
${lib.css ||!lib.css ? "import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'" : ''}

export default defineConfig({
  plugins: ${plugins},
  build: {
    outDir: '.temp-build',
    emptyOutDir: ${isFirst},
    lib: {
      entry: resolve(__dirname, 'src/lib/${lib.name}.js'),
      name: '${lib.globalName}',
      formats: ['iife'],
      fileName: () => '${lib.outputFile}'
    },
    rollupOptions: {
      external: ['vue', 'vue-demi'],
      output: {
        globals: {
          'vue': 'Vue',
          'vue-demi': 'VueDemi'
        }
      }
    }
  }
})
`
}

function createTempFiles(libs) {
  console.log('📝 创建临时文件...')
  
  const srcLibDir = path.join(rootDir, 'src/lib')
  if (!fs.existsSync(srcLibDir)) {
    fs.mkdirSync(srcLibDir, { recursive: true })
  }
  
  libs.forEach((lib, index) => {
    const entryPath = path.join(rootDir, `src/lib/${lib.name}.js`)
    const configPath = path.join(rootDir, `vite.config.${lib.name}.js`)
    
    fs.writeFileSync(entryPath, getEntryContent(lib), 'utf-8')
    fs.writeFileSync(configPath, getViteConfigContent(lib, index === 0), 'utf-8')
    
    console.log(`  ✓ 创建: src/lib/${lib.name}.js`)
    console.log(`  ✓ 创建: vite.config.${lib.name}.js`)
  })
}

function deleteTempFiles(libs) {
  console.log('\n🗑️  删除临时文件...')
  
  libs.forEach(lib => {
    const entryPath = path.join(rootDir, `src/lib/${lib.name}.js`)
    const configPath = path.join(rootDir, `vite.config.${lib.name}.js`)
    
    if (fs.existsSync(entryPath)) {
      fs.unlinkSync(entryPath)
      console.log(`  ✓ 删除: src/lib/${lib.name}.js`)
    }
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
      console.log(`  ✓ 删除: vite.config.${lib.name}.js`)
    }
  })
  
  const srcLibDir = path.join(rootDir, 'src/lib')
  if (fs.existsSync(srcLibDir) && fs.readdirSync(srcLibDir).length === 0) {
    fs.rmdirSync(srcLibDir)
    console.log(`  ✓ 删除目录: src/lib`)
  }
}

function copyToLib(libs) {
  console.log('\n📋 复制文件到 public/lib...')
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true })
  }
  
  libs.forEach(lib => {
    const src = path.join(tempDir, lib.outputFile)
    const dest = path.join(libDir, lib.outputFile)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      console.log(`  ✓ 复制: ${lib.outputFile}`)
    }
  })
}

function deleteTempDir() {
  console.log('\n🗑️  删除临时目录...')
  
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true })
    console.log(`  ✓ 删除: ${path.relative(rootDir, tempDir)}`)
  }
}

function buildLib(lib) {
  const viteCmd = process.platform === 'win32'
    ? path.join(rootDir, 'node_modules/.bin/vite.cmd')
    : path.join(rootDir, 'node_modules/.bin/vite')
  
  console.log(`\n📦 开始打包 ${lib.globalName} 组件...`)
  execSync(`"${viteCmd}" build --config vite.config.${lib.name}.js`, {
    stdio: 'inherit'
  })
}

function build() {
  const libs = getTargetLibs()
  
  if (libs.length === 1) {
    console.log(`\n🎯 打包单个库: ${libs[0].name}`)
  } else {
    console.log(`\n📦 打包 ${libs.length} 个库: ${libs.map(l => l.name).join(', ')}`)
  }
  
  try {
    createTempFiles(libs)
    
    process.chdir(rootDir)
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true })
    }
    fs.mkdirSync(tempDir, { recursive: true })
    
    libs.forEach(lib => buildLib(lib))
    
    copyToLib(libs)
    
    console.log('\n✅ 打包完成！')
  } catch (error) {
    console.error('\n❌ 打包失败:', error.message)
    process.exit(1)
  } finally {
    process.chdir(originalCwd)
    deleteTempFiles(libs)
    deleteTempDir()
  }
}

build()
