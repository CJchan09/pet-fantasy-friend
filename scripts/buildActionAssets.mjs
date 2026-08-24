/**
 * 四格动作母图 -> 透明 500x500 PNG，并把四阶段帧接进游戏 WebP 资产。
 *
 * 输入：../../Image/新美术素材_动作四格_20260823/{rarity}/{creature}/{stage}_动作四格.png
 * 输出：../../Image/新美术素材_动作拆分_透明500_20260823/{rarity}/{creature}/...
 * 游戏：public/creatures/{slug}_s{1..4}_{state}.webp
 *
 * 需要仓库根目录的 .rembg-venv，并已下载 u2net 模型。
 */
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(dirname, '..')
const IMAGE_ROOT = path.resolve(ROOT, '../Image')
const SHEET_ROOT = path.join(IMAGE_ROOT, '新美术素材_动作四格_20260823')
const SPLIT_ROOT = path.join(IMAGE_ROOT, '新美术素材_动作拆分_透明500_20260823')
const ORIGINAL_ROOT = path.join(IMAGE_ROOT, '新美术素材_待审核_20260820')
const CLOSED_ROOT = path.join(IMAGE_ROOT, '新美术素材_闭眼版_透明500_20260823')
const STAGING_ROOT = path.join(ROOT, '.action-assets-staging')
const STAGING_INPUT = path.join(STAGING_ROOT, 'input')
const STAGING_OUTPUT = path.join(STAGING_ROOT, 'output')
const GAME_ASSET_ROOT = path.join(ROOT, 'public', 'creatures')
const REMBG = path.join(ROOT, '.rembg-venv', 'Scripts', 'rembg.exe')

const ACTIONS = [
  { name: '走路A', state: 'walk-a', left: 0, top: 0 },
  { name: '走路B', state: 'walk-b', left: 1, top: 0 },
  { name: '疲倦趴下', state: 'tired', left: 0, top: 1 },
  { name: '沉睡蜷缩', state: 'dormant', left: 1, top: 1 },
]

const STAGES = [
  { name: '1_幼年', number: 1 },
  { name: '2_成年', number: 2 },
  { name: '3_老年', number: 3 },
  { name: '4_仙人级', number: 4 },
]
const STAGE_NUMBER = new Map(STAGES.map((stage) => [stage.name, stage.number]))
const CANVAS_SIZE = 500
const BASE_LONGEST_EDGE = 460
const ALPHA_AREA_THRESHOLD = 96

const CREATURE_SLUGS = {
  'Common/01_苔藓熊': 'mossbear',
  'Common/02_灵狐': 'spiritfox',
  'Common/03_云羊': 'cloudsheep',
  'Common/04_雾鹿': 'mistdeer',
  'Common/05_溪龟': 'streamturtle',
  'Common/06_萤火兔': 'fireflyrabbit',
  'Common/07_露珠猫': 'dewdropcat',
  'Common/08_蜜羽雀': 'honeysparrow',
  'Common/09_果冻蛙': 'jellyfrog',
  'Common/10_棉花狸': 'cottonraccoon',
  'Epic/01_珊瑚幼鲸': 'coralwhale',
  'Epic/02_琥珀狼': 'amberwolf',
  'Epic/03_晶蝶马驹': 'crystalfoal',
  'Epic/04_熔烬龟龙': 'emberturtle',
  'Epic/05_极光九尾狐': 'aurorafox',
  'Epic/06_星尘水獭': 'stardustotter',
  'Legend/01_星岚幻龙': 'stardragon',
  'Legend/02_永夜凤凰': 'nightphoenix',
  'Legend/03_虹光麒麟': 'rainbowqilin',
  'Legend/04_深海古鲛': 'sharkmermaid',
}

const CREATURE_FOLDERS = Object.entries(CREATURE_SLUGS)

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? filesUnder(entryPath) : [entryPath]
    }),
  )
  return nested.flat()
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${path.basename(command)} exited with code ${code}`))
    })
  })
}

async function normalizeFrame(source, longestEdge = BASE_LONGEST_EDGE) {
  const trimmed = await sharp(source)
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 20 })
    .png()
    .toBuffer()
  const inset = Math.floor((CANVAS_SIZE - longestEdge) / 2)
  const remainder = CANVAS_SIZE - longestEdge - inset

  return sharp(trimmed)
    .resize(longestEdge, longestEdge, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .extend({
      top: inset,
      right: remainder,
      bottom: remainder,
      left: inset,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

async function visibleArea(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let area = 0
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] >= ALPHA_AREA_THRESHOLD) area += 1
  }
  return area
}

function matchedLongestEdge(referenceArea, frameArea) {
  if (referenceArea <= 0 || frameArea <= 0) return BASE_LONGEST_EDGE
  const scale = Math.sqrt(referenceArea / frameArea)
  return Math.round(BASE_LONGEST_EDGE * Math.max(0.72, Math.min(1, scale)))
}

await rm(STAGING_ROOT, { recursive: true, force: true })
await Promise.all([
  mkdir(STAGING_INPUT, { recursive: true }),
  mkdir(STAGING_OUTPUT, { recursive: true }),
  mkdir(SPLIT_ROOT, { recursive: true }),
  mkdir(GAME_ASSET_ROOT, { recursive: true }),
])

const sheetPaths = (await filesUnder(SHEET_ROOT)).filter((file) => file.endsWith('_动作四格.png'))
const manifest = []

for (const sheetPath of sheetPaths) {
  const relative = path.relative(SHEET_ROOT, sheetPath)
  const [rarity, creatureFolder] = relative.split(path.sep)
  const slug = CREATURE_SLUGS[`${rarity}/${creatureFolder}`]
  if (!slug) continue

  const stageName = path.basename(sheetPath, '_动作四格.png')
  const metadata = await sharp(sheetPath).metadata()
  const cellWidth = Math.floor(metadata.width / 2)
  const cellHeight = Math.floor(metadata.height / 2)

  for (const action of ACTIONS) {
    const stagingName = `${slug}__${stageName}__${action.state}.png`
    await sharp(sheetPath)
      .extract({
        left: action.left * cellWidth,
        top: action.top * cellHeight,
        width: cellWidth,
        height: cellHeight,
      })
      .png()
      .toFile(path.join(STAGING_INPUT, stagingName))

    manifest.push({ rarity, creatureFolder, slug, stageName, action, stagingName })
  }
}

for (const [relativeFolder, slug] of CREATURE_FOLDERS) {
  const [rarity, creatureFolder] = relativeFolder.split('/')
  for (const stage of STAGES) {
    const stagingName = `${slug}__${stage.name}__eyes-open.png`
    await sharp(path.join(ORIGINAL_ROOT, rarity, creatureFolder, `${stage.name}.jpg`))
      .png()
      .toFile(path.join(STAGING_INPUT, stagingName))
    manifest.push({
      rarity,
      slug,
      creatureFolder,
      stageName: stage.name,
      state: 'eyes-open',
      stagingName,
    })
  }
}

if (manifest.length === 0) {
  throw new Error(`No supported action sheets found below ${SHEET_ROOT}`)
}

await writeFile(path.join(STAGING_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2))
await run(REMBG, ['p', '-m', 'u2net', STAGING_INPUT, STAGING_OUTPUT])

const prepared = []
for (const item of manifest) {
  const source = path.join(STAGING_OUTPUT, item.stagingName)
  const preview = await normalizeFrame(source)
  prepared.push({ ...item, source, area: await visibleArea(preview) })
}

const referenceAreas = new Map(
  prepared
    .filter((item) => !item.action)
    .map((item) => [`${item.slug}/${item.stageName}`, item.area]),
)

for (const item of prepared) {
  const isAction = Boolean(item.action)
  const destinationDir = path.join(SPLIT_ROOT, item.rarity, item.creatureFolder)
  const destination = isAction
    ? path.join(destinationDir, `${item.stageName}_${item.action.name}.png`)
    : path.join(destinationDir, `${item.stageName}_睁眼.png`)
  await mkdir(destinationDir, { recursive: true })

  const referenceArea = referenceAreas.get(`${item.slug}/${item.stageName}`)
  const longestEdge = isAction
    ? matchedLongestEdge(referenceArea, item.area)
    : BASE_LONGEST_EDGE
  const normalized = await normalizeFrame(await readFile(item.source), longestEdge)

  await writeFile(destination, normalized)

  const stageNumber = STAGE_NUMBER.get(item.stageName)
  if (!stageNumber) throw new Error(`Unknown stage: ${item.stageName}`)

  if (isAction) {
    await sharp(normalized)
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(path.join(GAME_ASSET_ROOT, `${item.slug}_s${stageNumber}_${item.action.state}.webp`))
  } else if (!isAction) {
    for (const state of ['active', 'eyes-open', 'joy']) {
      await sharp(normalized)
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(path.join(GAME_ASSET_ROOT, `${item.slug}_s${stageNumber}_${state}.webp`))
    }
  }
}

for (const [relativeFolder, slug] of CREATURE_FOLDERS) {
  const [rarity, creatureFolder] = relativeFolder.split('/')
  for (const stage of STAGES) {
    const closed = path.join(CLOSED_ROOT, rarity, creatureFolder, `${stage.name}_闭眼.png`)
    const preview = await normalizeFrame(closed)
    const referenceArea = referenceAreas.get(`${slug}/${stage.name}`)
    const normalized = await normalizeFrame(
      closed,
      matchedLongestEdge(referenceArea, await visibleArea(preview)),
    )
    await sharp(normalized)
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(path.join(GAME_ASSET_ROOT, `${slug}_s${stage.number}_eyes-closed.webp`))
  }
}

await rm(STAGING_ROOT, { recursive: true, force: true })
console.log(`完成：${manifest.length} 张透明动作/睁眼帧，20 只宠物的四阶段已接入游戏。`)
