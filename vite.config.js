import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import viteCompression from 'vite-plugin-compression'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig(({ mode }) => {
  const plugins = [
    vue(),
    cssInjectedByJsPlugin({
      relativeCSSInjection: true
    })
  ]
  
  if (mode === 'production-gz') {
    plugins.push(
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz'
      })
    )
  }
  
  return {
    base: './',
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      'process.env': {}
    },
    server: {
      port: 3200,
      host: true,
      fs: {
        strict: false
      }
    },
    build: {
      modulePreload: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          // drop_console: true,
          // drop_debugger: true
        }
      },
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          manualChunks(id) {
            if (id.includes('@vue-office/excel')) {
              return 'excel'
            }
            if (id.includes('@vue-office/pdf')) {
              return 'pdf'
            }
            if (id.includes('node_modules/vue/') || 
                id.includes('node_modules/vue-demi/') || 
                id.includes('node_modules/vue-router/') ||
                id.includes('node_modules/@vue/')) {
              return 'vue-vendor'
            }
          }
        }
      }
    }
  }
})
