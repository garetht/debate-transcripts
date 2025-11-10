import { defineConfig } from 'vite'
import path from 'node:path'

const rootDir = path.resolve(__dirname)
const transcriptsDir = path.resolve(__dirname, '..', 'transcripts')

export default defineConfig({
  base: './', // ensure assets resolve correctly when served from GitHub Pages
  assetsInclude: ['**/*.parquet'],
  server: {
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
})
