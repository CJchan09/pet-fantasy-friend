import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const [sourceRootArg, outputRootArg, rembgExecutableArg] = process.argv.slice(2)

if (!sourceRootArg || !outputRootArg || !rembgExecutableArg) {
  console.error(
    'Usage: node scripts/buildTransparentPetAssets.mjs <source-root> <output-root> <rembg-executable>',
  )
  process.exit(1)
}

const sourceRoot = path.resolve(sourceRootArg)
const outputRoot = path.resolve(outputRootArg)
const rembgExecutable = path.resolve(rembgExecutableArg)
const tempRoot = path.join(outputRoot, `.rembg-${randomUUID()}`)
const tempInput = path.join(tempRoot, 'input')
const tempOutput = path.join(tempRoot, 'output')

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (/_闭眼\.(?:jpe?g|png)$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

async function writeFinal(inputPath, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  const resolvedInput = path.resolve(inputPath)
  const resolvedOutput = path.resolve(outputPath)
  const writePath =
    resolvedInput === resolvedOutput ? `${resolvedOutput}.${randomUUID()}.tmp.png` : resolvedOutput

  await sharp(inputPath)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(460, 460, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(writePath)

  if (writePath !== resolvedOutput) {
    await fs.copyFile(writePath, resolvedOutput)
    await fs.rm(writePath)
  }
}

const candidates = (await walk(sourceRoot)).sort((left, right) => left.localeCompare(right, 'zh'))
const selected = new Map()

for (const inputPath of candidates) {
  const relativePath = path.relative(sourceRoot, inputPath)
  const key = relativePath.replace(/\.(?:jpe?g|png)$/i, '')
  const current = selected.get(key)
  if (!current || path.extname(inputPath).toLowerCase() === '.png') {
    selected.set(key, inputPath)
  }
}

const opaqueAssets = []
let transparentCount = 0

await fs.mkdir(tempInput, { recursive: true })
await fs.mkdir(tempOutput, { recursive: true })

for (const [relativeStem, inputPath] of selected) {
  const metadata = await sharp(inputPath).metadata()
  const outputPath = path.join(outputRoot, `${relativeStem}.png`)

  if (metadata.hasAlpha && !(await sharp(inputPath).stats()).isOpaque) {
    await writeFinal(inputPath, outputPath)
    transparentCount += 1
    continue
  }

  const index = opaqueAssets.length.toString().padStart(4, '0')
  const stagedName = `asset-${index}.png`
  await sharp(inputPath).png().toFile(path.join(tempInput, stagedName))
  opaqueAssets.push({ stagedName, outputPath })
}

if (opaqueAssets.length > 0) {
  const result = spawnSync(
    rembgExecutable,
    ['p', '-m', 'isnet-anime', tempInput, tempOutput],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) {
    throw new Error(`rembg exited with status ${result.status ?? 'unknown'}`)
  }

  for (const asset of opaqueAssets) {
    await writeFinal(path.join(tempOutput, asset.stagedName), asset.outputPath)
  }
}

if (!tempRoot.startsWith(outputRoot + path.sep)) {
  throw new Error('Refusing to clean a temporary directory outside the output root')
}
await fs.rm(tempRoot, { recursive: true, force: true })

console.log(
  JSON.stringify({
    total: selected.size,
    backgroundRemoved: opaqueAssets.length,
    alreadyTransparent: transparentCount,
    outputRoot,
  }),
)
