import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import path from 'node:path'
import { createRequire } from 'node:module'

const rootDir = path.resolve(__dirname)
const transcriptsDir = path.resolve(__dirname, '..', 'transcripts')
const require = createRequire(import.meta.url)

const hasJsdom = (() => {
  try {
    require.resolve('jsdom')
    return true
  } catch {
    return false
  }
})()

export default defineConfig({
  base: './', // ensure assets resolve correctly when served from GitHub Pages
  assetsInclude: ['**/*.parquet'],
  server: {
    host: '0.0.0.0',
    fs: {
      // Allow importing assets from the Vite project root and sibling transcripts directory.
      allow: [rootDir, transcriptsDir],
    },
  },
  resolve: {
    alias: {
      '@transcripts': transcriptsDir,
    },
  },
  test: {
    globals: true,
    environment: hasJsdom ? 'jsdom' : 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude],
    css: true,
    passWithNoTests: true,
  },
})
