/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages 项目站点跑在 /<repo>/ 子路径下，本地开发和其他静态托管仍用根路径
const base = process.env.GITHUB_PAGES === 'true' ? '/pet-fantasy-friend/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      base,
      manifest: {
        name: 'Pet Fantasy Friend',
        short_name: 'PFF',
        description: '把你的成长变成一只值得养的幻想生物',
        theme_color: '#6b5b95',
        background_color: '#f4f1ea',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
