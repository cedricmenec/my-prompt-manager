import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'storage/indexeddb': resolve(__dirname, 'src/storage/indexeddb.ts'),
        'storage/memory': resolve(__dirname, 'src/storage/memory.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['idb', 'react', 'react-dom'],
      output: {
        preserveModules: false,
      },
    },
    target: 'es2023',
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
})