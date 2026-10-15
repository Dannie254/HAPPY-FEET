import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import sri from 'vite-plugin-sri'

export default defineConfig({
  plugins: [
    react(),
    sri({
      hash: 'sha384',
      crossorigin: 'anonymous',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})