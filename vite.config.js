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

  const indexHash = Math.random().toString(32).slice(-3)
  const chunkHash = Math.random().toString(32).slice(-3)
  
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
          entryFileNames: `assets/index-${indexHash}.js`, // index-${indexHash}
          chunkFileNames: 'assets/[name].js',
          manualChunks(id) {
            if (id.includes('@vue-office/excel')) {
              return `excel-${chunkHash}`
            }
            if (id.includes('@vue-office/pdf')) {
              return `pdf-${chunkHash}`
            }
            // if (id.includes('node_modules/vue/') || 
            //     id.includes('node_modules/vue-demi/') || 
            //     id.includes('node_modules/vue-router/') ||
            //     id.includes('node_modules/@vue/')) {
            //   return `index-${indexHash}`
            // }
            return `index-${indexHash}`
          }
        }
      }
    }
  }
})
