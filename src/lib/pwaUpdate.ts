import { registerSW } from 'virtual:pwa-register'

/**
 * Service Worker 注册与自动更新。
 *
 * 为什么要自己写这段，不用插件默认注入的 `registerSW.js`（2026-08-29 修复）：
 * 插件默认注入的那个脚本只有一行 `navigator.serviceWorker.register(...)`，
 * 没有任何「发现新版本 → 刷新页面」的逻辑。结果是每次部署之后，
 * 用户第一次打开看到的仍然是上一版的缓存内容，必须自己手动再刷一次才会换。
 * 实测：v2 经济上线后，线上 sw.js 已经指向新 bundle，页面却还显示旧的「+15 ⭐ / 0/4 次」。
 *
 * 改成用 `virtual:pwa-register`：registerType 为 autoUpdate 时，
 * 它在新 SW 接管的那一刻自己调用 updateSW() 并重载页面，用户不需要知道「要刷新」这件事。
 */

/** PWA 装到主屏幕之后可能几天都不关，光靠打开页面那一次检查不够，定时再问一次 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function registerPwaUpdates(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return
      }
      window.setInterval(() => {
        // 页面在后台时查了也没意义，等回到前台再查
        if (document.visibilityState !== 'visible') {
          return
        }
        void registration.update()
      }, UPDATE_CHECK_INTERVAL_MS)
    },
    onRegisterError(error) {
      // SW 注册失败不该影响 App 本身——离线能力没了，功能还在
      console.warn('[pwa] service worker 注册失败', error)
    },
  })
}
