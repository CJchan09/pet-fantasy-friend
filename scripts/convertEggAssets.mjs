/**
 * 蛋美术资产管线：设计侧 2048px PNG（纯色摄影棚背景，无 alpha）→ 抠透明背景 → WebP。
 * 源目录：../Image/Egg/（设计侧维护，不动）
 * 输出：public/eggs/{slug}.webp
 *
 * 背景抠除用色距 chroma-key：取四角平均色当背景色，逐像素算色距，
 * 双门槛（KEY_INNER/KEY_OUTER）之间线性羽化 alpha，避免抠图边缘出现锯齿硬边。
 * 源图背景是近纯色摄影棚灰，这个简单实现足够干净；如果以后换了带渐变/纹理背景的图，需要换更复杂的抠图方式。
 *
 * 用法：node scripts/convertEggAssets.mjs
 * 设计侧更新 PNG 后重跑一次即可。
 */
import sharp from 'sharp'
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(dirname, '../../Image/Egg')
const OUT_DIR = path.resolve(dirname, '../public/eggs')

const MAX_SIZE = 512
const QUALITY = 85
const KEY_INNER = 18
const KEY_OUTER = 45

const EGG_SLUGS = {
  苔熊蛋: 'mossbear',
  灵狐蛋: 'spiritfox',
  云羊蛋: 'cloudsheep',
  星岚龙蛋: 'stardragon',
  雾角鹿蛋: 'mistdeer',
  溪石龟蛋: 'streamturtle',
}

await mkdir(OUT_DIR, { recursive: true })

const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.png'))
let converted = 0

for (const file of files) {
  const name = file.replace(/\.png$/, '')
  const slug = EGG_SLUGS[name]
  if (!slug) {
    console.warn(`跳过（未知蛋）: ${file}`)
    continue
  }

  const srcPath = path.join(SRC_DIR, file)
  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
  let br = 0
  let bg = 0
  let bb = 0
  for (const [x, y] of corners) {
    const i = (y * width + x) * channels
    br += data[i]
    bg += data[i + 1]
    bb += data[i + 2]
  }
  br /= corners.length
  bg /= corners.length
  bb /= corners.length

  const rgba = Buffer.alloc(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const i = p * channels
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const dist = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2)
    let alpha
    if (dist <= KEY_INNER) alpha = 0
    else if (dist >= KEY_OUTER) alpha = 255
    else alpha = Math.round(((dist - KEY_INNER) / (KEY_OUTER - KEY_INNER)) * 255)
    const o = p * 4
    rgba[o] = r
    rgba[o + 1] = g
    rgba[o + 2] = b
    rgba[o + 3] = alpha
  }

  const outName = `${slug}.webp`
  const outPath = path.join(OUT_DIR, outName)
  const outInfo = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outPath)
  converted++
  console.log(`${file} → ${outName} (${Math.round(outInfo.size / 1024)} KB)`)
}

console.log(`\n完成：${converted} 张`)
