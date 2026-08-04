/**
 * 生成网站图标 / PWA 图标全套，源文件是设计侧交付的蛋形 Logo（透明背景矢量+位图）。
 * 源：../Image/logo/62120c2d-4bd4-4e15-a069-1352ab6b5653.png（2048x2048，透明背景，内容居中，四周留白约 36%）
 *
 * 内容实际占用约 (786,732)-(1260,1316)（居中于画布），四周留白很多——
 * 对 favicon/apple-touch-icon 这类小尺寸场景太空、图形会看不清，所以裁一个「紧凑版」（800x800，内容占约 73%）；
 * 对 maskable PWA 图标保留原始留白（更安全，不会被系统遮罩裁切掉边缘）。
 *
 * 用法：node scripts/generateIcons.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PNG = path.resolve(dirname, '../../Image/logo/62120c2d-4bd4-4e15-a069-1352ab6b5653.png')
const OUT_DIR = path.resolve(dirname, '../public')

const APP_CREAM_BG = '#efe9dc' // 与 src/index.css 的 --color-cream-300 完全一致

// 内容居中于 (1024,1024)，紧凑裁切取 800x800（内容占比约 73%，留白约 13.5%/边）
const TIGHT_CROP = { left: 624, top: 624, width: 800, height: 800 }

await mkdir(OUT_DIR, { recursive: true })

function tightBuffer() {
  return sharp(SRC_PNG).extract(TIGHT_CROP).toBuffer()
}

async function makeTransparent(size, outName) {
  const buf = await tightBuffer()
  await sharp(buf).resize(size, size).png().toFile(path.join(OUT_DIR, outName))
  console.log(`✓ ${outName} (${size}x${size}, transparent, tight crop)`)
}

async function makeFilled(size, outName, { tight = true } = {}) {
  const buf = tight ? await tightBuffer() : SRC_PNG
  await sharp(buf)
    .resize(size, size)
    .flatten({ background: APP_CREAM_BG })
    .png()
    .toFile(path.join(OUT_DIR, outName))
  console.log(`✓ ${outName} (${size}x${size}, filled ${APP_CREAM_BG}${tight ? ', tight crop' : ', full padding'})`)
}

// favicon PNG 兜底（不支持 svg favicon 的老浏览器用）
await makeTransparent(64, 'favicon-64x64.png')

// apple-touch-icon：iOS 不支持透明，用紧凑裁切 + App 同款奶油底色
await makeFilled(180, 'apple-touch-icon.png')

// PWA manifest "any" 用途
await makeFilled(192, 'pwa-192x192.png')
await makeFilled(512, 'pwa-512x512.png')

// PWA manifest "maskable" 用途：系统会做圆形/圆角方形遮罩裁切，必须留足安全边距，用原始满留白版本
await makeFilled(512, 'maskable-icon-512x512.png', { tight: false })

console.log('\n完成，全部生成到 public/。favicon.svg 另外手写（紧凑 viewBox + 保留透明）。')
