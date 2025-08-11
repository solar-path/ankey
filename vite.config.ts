import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import mdx from '@mdx-js/rollup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    mdx({
      providerImportSource: '@mdx-js/react',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3001',
        changeOrigin: false, // Preserve original host header for tenant detection
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Preserve original host header for subdomain detection
            if (req.headers.host) {
              proxyReq.setHeader('host', req.headers.host)
            }
          })
        },
      },
    },
  },
  preview: {
    port: 3000,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
