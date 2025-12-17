import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['**/*.test.ts', '**/*.test.tsx']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
