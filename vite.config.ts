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
      // 不用插件默认注入的 registerSW.js——它只注册 SW，不会在发现新版本时刷新页面，
      // 导致每次部署后用户第一次打开还是旧缓存。改由 src/lib/pwaUpdate.ts 手动注册。
      injectRegister: null,
      base,
      workbox: {
        // 斗兽棋游戏用 <iframe src="games/dou-shou-qi/index.html"> 嵌入，iframe 加载也是一次
        // navigation 请求。Workbox 的 SPA 离线兜底默认会把所有 navigation 请求都导回 index.html，
        // 这会导致 iframe 实际显示的是 App 主界面而不是游戏本身（线上实测发现，本地 dev 因为没装
        // service worker测不出来）。把 /games/ 路径排除在 SPA 兜底之外即可。
        navigateFallbackDenylist: [/\/games\//],
      },
      manifest: {
        name: 'Pet Fantasy Friend',
        short_name: 'PFF',
        description: '把你的成长变成一只值得养的幻想生物',
        theme_color: '#efe9dc',
        background_color: '#efe9dc',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
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
