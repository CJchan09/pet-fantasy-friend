/**
 * 斗兽棋小游戏资产管线：把源文件夹（../dou-shou-qi/）里游戏实际用到的图片转成 WebP，
 * 输出到 public/games/dou-shou-qi/。
 *
 * 只拷贝游戏真正引用的文件：
 * - assets/head/*.png（棋子头像，游戏当前用这套，根目录那份全身图 index.html 里注释写了
 *   "想换回全身图才需要"，现在没被引用，不拷贝，省掉一半体积）
 * - assets/den.png / frame.png / tex_*.png（棋盘贴图）
 * - assets/trap.svg / trap_snap.svg（矢量，本来就小，直接拷贝）
 * - index.html（拷贝后把 .png 引用改成 .webp）
 *
 * 不拷贝：image/（AI 生成的概念图，游戏没引用）、tools/（Python 资产生成脚本，运行期不需要）
 *
 * 用法：node scripts/convertAnimalChessAssets.mjs
 */
import sharp from 'sharp'
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve(dirname, '../../dou-shou-qi')
const OUT_DIR = path.resolve(dirname, '../public/games/dou-shou-qi')

const QUALITY = 85

async function convertToWebp(relPath) {
  const src = path.join(SRC_DIR, relPath)
  const outRel = relPath.replace(/\.png$/, '.webp')
  const out = path.join(OUT_DIR, outRel)
  await mkdir(path.dirname(out), { recursive: true })
  const info = await sharp(src).webp({ quality: QUALITY }).toFile(out)
  console.log(`✓ ${relPath} → ${outRel} (${Math.round(info.size / 1024)} KB)`)
  return outRel
}

async function copyAsIs(relPath) {
  const src = path.join(SRC_DIR, relPath)
  const out = path.join(OUT_DIR, relPath)
  await mkdir(path.dirname(out), { recursive: true })
  await copyFile(src, out)
  console.log(`✓ ${relPath} (copied as-is)`)
}

const HEAD_ANIMALS = ['rat', 'cat', 'dog', 'wolf', 'leopard', 'tiger', 'lion', 'elephant']

await mkdir(OUT_DIR, { recursive: true })

for (const animal of HEAD_ANIMALS) {
  await convertToWebp(`assets/head/${animal}.png`)
}
for (const name of ['den', 'frame', 'tex_dirt', 'tex_grass', 'tex_water']) {
  await convertToWebp(`assets/${name}.png`)
}
await copyAsIs('assets/trap.svg')
await copyAsIs('assets/trap_snap.svg')

// index.html：把用到的 .png 引用换成 .webp，其余原样拷贝
let html = await readFile(path.join(SRC_DIR, 'index.html'), 'utf-8')
const allConverted = [
  ...HEAD_ANIMALS.map((a) => `assets/head/${a}.png`),
  'assets/den.png',
  'assets/frame.png',
  'assets/tex_dirt.png',
  'assets/tex_grass.png',
  'assets/tex_water.png',
]
for (const relPath of allConverted) {
  html = html.split(relPath).join(relPath.replace(/\.png$/, '.webp'))
}

// 接入 postMessage 桥：游戏结束时把结果报给外层 React 页面（是否发星尘由外层决定，
// 这里只负责如实上报，不掺业务逻辑）。同源 iframe，用 location.origin 而不是 '*'。
const SHOW_WIN_ORIGINAL = `function showWin(winner){
    const overlay = document.getElementById('winOverlay');
    const text = document.getElementById('winText');
    text.textContent = (winner==='red' ? '红方获胜！' : '蓝方获胜！');
    overlay.classList.add('show');
  }`
const SHOW_WIN_PATCHED = `function showWin(winner){
    const overlay = document.getElementById('winOverlay');
    const text = document.getElementById('winText');
    text.textContent = (winner==='red' ? '红方获胜！' : '蓝方获胜！');
    overlay.classList.add('show');
    try {
      window.parent.postMessage({
        source: 'dou-shou-qi',
        type: 'gameOver',
        winner: winner,
        aiOwner: aiOwner,
      }, window.location.origin);
    } catch (e) {}
  }`
if (!html.includes(SHOW_WIN_ORIGINAL)) {
  throw new Error('showWin() 函数文本对不上，源文件可能改过，需要重新核对 postMessage 补丁位置')
}
html = html.replace(SHOW_WIN_ORIGINAL, SHOW_WIN_PATCHED)

await writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8')
console.log('✓ index.html (png 引用已替换为 webp，已接入 postMessage 结果上报)')

console.log('\n完成，全部输出到 public/games/dou-shou-qi/')
