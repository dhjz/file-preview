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
        external: ['vue', 'vue-demi'],
        output: {
          format: 'iife',
          entryFileNames: `assets/index-${indexHash}.js`,
          // chunkFileNames: 'assets/[name].js',
          globals: {
            'vue': 'Vue',
            'vue-demi': 'VueDemi'
          },
          // manualChunks(id) {
          //   if (id.includes('@vue-office/excel')) {
          //     return `excel-${chunkHash}`
          //   }
          //   if (id.includes('@vue-office/pdf')) {
          //     return `pdf-${chunkHash}`
          //   }
          //   return `index-${indexHash}`
          // }
        }
      }
    }
  }
})
