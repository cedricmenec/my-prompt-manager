import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/my-prompt-manager/',
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
    },
  },
})
