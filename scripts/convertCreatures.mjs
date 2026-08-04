/**
 * 宠物美术资产管线：把设计侧交付的 2048px PNG 压成 web 用的 WebP。
 * 源目录：../Image/宠物png/（设计侧维护，不动）
 * 输出：public/creatures/{slug}_{state}.webp
 *
 * 用法：node scripts/convertCreatures.mjs
 * 设计侧更新 PNG 后重跑一次即可。
 */
import sharp from 'sharp'
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(dirname, '../../Image/宠物png')
const OUT_DIR = path.resolve(dirname, '../public/creatures')

const MAX_SIZE = 768
const QUALITY = 82

const CREATURE_SLUGS = {
  苔熊: 'mossbear',
  灵狐: 'spiritfox',
  云羊: 'cloudsheep',
  星岚龙: 'stardragon',
  雾角鹿: 'mistdeer',
  溪石龟: 'streamturtle',
}

const STATE_SLUGS = {
  活跃: 'active',
  疲倦: 'tired',
  沉睡: 'dormant',
  喜悦: 'joy',
  睁眼: 'eyes-open',
  闭眼: 'eyes-closed',
}

await mkdir(OUT_DIR, { recursive: true })

const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.png'))
let converted = 0

for (const file of files) {
  // 文件名格式：{生物}_{阶段}_{状态}.png，如 苔熊_S1_活跃.png
  const match = file.match(/^(.+?)_S(\d+)_(.+?)\.png$/)
  if (!match) {
    console.warn(`跳过（文件名不符合规则）: ${file}`)
    continue
  }
  const [, creature, stage, state] = match
  const creatureSlug = CREATURE_SLUGS[creature]
  const stateSlug = STATE_SLUGS[state]
  if (!creatureSlug || !stateSlug) {
    console.warn(`跳过（未知生物或状态）: ${file}`)
    continue
  }

  const outName = `${creatureSlug}_s${stage}_${stateSlug}.webp`
  const outPath = path.join(OUT_DIR, outName)
  const info = await sharp(path.join(SRC_DIR, file))
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outPath)
  converted++
  console.log(`${file} → ${outName} (${Math.round(info.size / 1024)} KB)`)
}

console.log(`\n完成：${converted} 张`)
