/**
 * 斗兽棋小游戏资产管线：把源文件夹（../dou-shou-qi/）里游戏实际用到的图片转成 WebP，
 * 输出到 public/games/dou-shou-qi/。
 *
 * 只拷贝游戏真正引用的文件：
 * - assets/head/*.png（棋子头像，游戏当前用这套，根目录那份全身图 index.html 里注释写了
 *   "想换回全身图才需要"，现在没被引用，不拷贝，省掉一半体积）
 * - assets/den.png / frame.png / tex_*.png（棋盘贴图）
 * - assets/trap.svg / trap_snap.svg（矢量，本来就小，直接拷贝）
 * - index.html（拷贝后把 .png 引用改成 .webp，并接入 postMessage 结果上报 + 中英文 i18n）
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

/**
 * 补丁列表：每一项都是「原文本 -> 替换后文本」，替换前先断言原文本存在——
 * 源文件被 CJ 改过的话会在这里直接报错，不会悄悄漏补。
 */
function applyPatch(source, original, patched, label) {
  if (!source.includes(original)) {
    throw new Error(`补丁「${label}」对不上源文件文本，dou-shou-qi/index.html 可能改过，需要重新核对`)
  }
  return source.replace(original, patched)
}

// ---- HTML：给需要多语言的元素加 id，方便运行时用 JS 设置文案 ----
html = applyPatch(html, '<h1>斗兽棋</h1>', '<h1 id="gameTitle">斗兽棋</h1>', 'h1 标题加 id')
html = applyPatch(
  html,
  '<label for="modeSelect">对战模式：</label>',
  '<label for="modeSelect" id="modeLabel">对战模式：</label>',
  '对战模式 label 加 id',
)
html = applyPatch(
  html,
  '<option value="none">双人对战（本地两人轮流）</option>',
  '<option value="none" id="modeOptNone">双人对战（本地两人轮流）</option>',
  '模式选项-双人对战 加 id',
)
html = applyPatch(
  html,
  '<option value="ai-blue" selected>我执红，AI 执蓝</option>',
  '<option value="ai-blue" selected id="modeOptAiBlue">我执红，AI 执蓝</option>',
  '模式选项-AI执蓝 加 id',
)
html = applyPatch(
  html,
  '<option value="ai-red">我执蓝，AI 执红</option>',
  '<option value="ai-red" id="modeOptAiRed">我执蓝，AI 执红</option>',
  '模式选项-AI执红 加 id',
)
html = applyPatch(
  html,
  '<span>象8 &gt; 狮7 &gt; 虎6 &gt; 豹5 &gt; 狼4 &gt; 狗3 &gt; 猫2 &gt; 鼠1</span>',
  '<span id="legend1">象8 &gt; 狮7 &gt; 虎6 &gt; 豹5 &gt; 狼4 &gt; 狗3 &gt; 猫2 &gt; 鼠1</span>',
  '图例1 加 id',
)
html = applyPatch(
  html,
  '<span>鼠可下河吃象（需在陆地）；象不能吃鼠</span>',
  '<span id="legend2">鼠可下河吃象（需在陆地）；象不能吃鼠</span>',
  '图例2 加 id',
)
html = applyPatch(
  html,
  '<span>只有鼠能下河；狮/虎可跳河（鼠挡路则不能跳）</span>',
  '<span id="legend3">只有鼠能下河；狮/虎可跳河（鼠挡路则不能跳）</span>',
  '图例3 加 id',
)
html = applyPatch(
  html,
  '<span>踩进对方陷阱的棋子任何子都能吃</span>',
  '<span id="legend4">踩进对方陷阱的棋子任何子都能吃</span>',
  '图例4 加 id',
)

// ---- JS：插入 I18N 字典 + 把 TYPES 里的动物名换成按语言取值，
// 并把静态文案元素（标题/按钮/图例/下拉选项）在启动时用 JS 设一遍 ----
const TYPES_ORIGINAL = `  const ROWS = 9, COLS = 7;

  // art: 头像图路径。想换回全身图，把 head/ 去掉即可（assets/rat.png）
  const TYPES = {
    rat:      { rank: 1, name: '鼠', art: 'assets/head/rat.webp' },
    cat:      { rank: 2, name: '猫', art: 'assets/head/cat.webp' },
    dog:      { rank: 3, name: '狗', art: 'assets/head/dog.webp' },
    wolf:     { rank: 4, name: '狼', art: 'assets/head/wolf.webp' },
    leopard:  { rank: 5, name: '豹', art: 'assets/head/leopard.webp' },
    tiger:    { rank: 6, name: '虎', art: 'assets/head/tiger.webp' },
    lion:     { rank: 7, name: '狮', art: 'assets/head/lion.webp' },
    elephant: { rank: 8, name: '象', art: 'assets/head/elephant.webp' },
  };`
const TYPES_PATCHED = `  const ROWS = 9, COLS = 7;

  // 语言由外层 React 页面通过 iframe 的 ?lang= 查询参数传入（见 AnimalChessScreen.tsx），
  // 默认简体中文；游戏本身也可以单独打开，这时就按 URL 参数或默认简体中文显示。
  const I18N = {
    'zh-CN': {
      animals: { rat:'鼠', cat:'猫', dog:'狗', wolf:'狼', leopard:'豹', tiger:'虎', lion:'狮', elephant:'象' },
      gameTitle: '斗兽棋',
      modeLabel: '对战模式：',
      modeNone: '双人对战（本地两人轮流）',
      modeAiBlue: '我执红，AI 执蓝',
      modeAiRed: '我执蓝，AI 执红',
      restart: '重新开始',
      playAgain: '再来一局',
      turnRed: '红方',
      turnBlue: '蓝方',
      turnSuffix: '回合',
      aiSuffix: '（AI）',
      thinkingSuffix: '（AI）思考中…',
      winRed: '红方获胜！',
      winBlue: '蓝方获胜！',
      legend1: '象8 > 狮7 > 虎6 > 豹5 > 狼4 > 狗3 > 猫2 > 鼠1',
      legend2: '鼠可下河吃象（需在陆地）；象不能吃鼠',
      legend3: '只有鼠能下河；狮/虎可跳河（鼠挡路则不能跳）',
      legend4: '踩进对方陷阱的棋子任何子都能吃',
    },
    en: {
      animals: { rat:'Rat', cat:'Cat', dog:'Dog', wolf:'Wolf', leopard:'Leo', tiger:'Tig', lion:'Lion', elephant:'Ele' },
      gameTitle: 'Jungle Chess',
      modeLabel: 'Mode:',
      modeNone: 'Local 2-player (pass & play)',
      modeAiBlue: 'You: Red · AI: Blue',
      modeAiRed: 'You: Blue · AI: Red',
      restart: 'Restart',
      playAgain: 'Play again',
      turnRed: 'Red',
      turnBlue: 'Blue',
      turnSuffix: "'s turn",
      aiSuffix: ' (AI)',
      thinkingSuffix: ' (AI) thinking…',
      winRed: 'Red wins!',
      winBlue: 'Blue wins!',
      legend1: 'Elephant8 > Lion7 > Tiger6 > Leopard5 > Wolf4 > Dog3 > Cat2 > Rat1',
      legend2: "Rat can enter the river to capture Elephant (must be on land); Elephant can't capture Rat",
      legend3: 'Only Rat can swim; Lion/Tiger can leap the river (blocked if a Rat is in the way)',
      legend4: "A piece standing in the opponent's trap can be captured by anything",
    },
  };
  const LANG = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh-CN';
  const L = I18N[LANG];

  document.title = L.gameTitle + ' Dou Shou Qi';
  document.getElementById('gameTitle').textContent = L.gameTitle;
  document.getElementById('modeLabel').textContent = L.modeLabel;
  document.getElementById('modeOptNone').textContent = L.modeNone;
  document.getElementById('modeOptAiBlue').textContent = L.modeAiBlue;
  document.getElementById('modeOptAiRed').textContent = L.modeAiRed;
  document.getElementById('restartBtn').textContent = L.restart;
  document.getElementById('winRestartBtn').textContent = L.playAgain;
  document.getElementById('legend1').textContent = L.legend1;
  document.getElementById('legend2').textContent = L.legend2;
  document.getElementById('legend3').textContent = L.legend3;
  document.getElementById('legend4').textContent = L.legend4;

  // art: 头像图路径。想换回全身图，把 head/ 去掉即可（assets/rat.png）
  const TYPES = {
    rat:      { rank: 1, name: L.animals.rat, art: 'assets/head/rat.webp' },
    cat:      { rank: 2, name: L.animals.cat, art: 'assets/head/cat.webp' },
    dog:      { rank: 3, name: L.animals.dog, art: 'assets/head/dog.webp' },
    wolf:     { rank: 4, name: L.animals.wolf, art: 'assets/head/wolf.webp' },
    leopard:  { rank: 5, name: L.animals.leopard, art: 'assets/head/leopard.webp' },
    tiger:    { rank: 6, name: L.animals.tiger, art: 'assets/head/tiger.webp' },
    lion:     { rank: 7, name: L.animals.lion, art: 'assets/head/lion.webp' },
    elephant: { rank: 8, name: L.animals.elephant, art: 'assets/head/elephant.webp' },
  };`
html = applyPatch(html, TYPES_ORIGINAL, TYPES_PATCHED, 'I18N 字典 + TYPES 动物名多语言化')

// render() 里拼状态文案（"红方回合"/"（AI）思考中…"）的部分换成走 L.*
const STATUS_TEXT_ORIGINAL = `    const st = statusEl();
    st.classList.remove('turn-red','turn-blue','win','thinking');
    if (!gameOver){
      const turnLabel = (currentTurn==='red' ? '红方' : '蓝方');
      const isAITurn = aiOwner===currentTurn;
      if (aiThinking){
        st.classList.add('thinking');
        st.textContent = \`\${turnLabel}（AI）思考中…\`;
      } else {
        st.classList.add(currentTurn==='red'?'turn-red':'turn-blue');
        st.textContent = turnLabel + '回合' + (isAITurn ? '（AI）' : '');
      }
    }`
const STATUS_TEXT_PATCHED = `    const st = statusEl();
    st.classList.remove('turn-red','turn-blue','win','thinking');
    if (!gameOver){
      const turnLabel = (currentTurn==='red' ? L.turnRed : L.turnBlue);
      const isAITurn = aiOwner===currentTurn;
      if (aiThinking){
        st.classList.add('thinking');
        st.textContent = \`\${turnLabel}\${L.thinkingSuffix}\`;
      } else {
        st.classList.add(currentTurn==='red'?'turn-red':'turn-blue');
        st.textContent = turnLabel + L.turnSuffix + (isAITurn ? L.aiSuffix : '');
      }
    }`
html = applyPatch(html, STATUS_TEXT_ORIGINAL, STATUS_TEXT_PATCHED, '回合状态文案多语言化')

// 接入 postMessage 桥（游戏结束时把结果报给外层 React 页面，是否发星尘由外层决定）
// 同时把「红方获胜！/蓝方获胜！」换成走 L.*。同源 iframe，用 location.origin 而不是 '*'。
const SHOW_WIN_ORIGINAL = `function showWin(winner){
    const overlay = document.getElementById('winOverlay');
    const text = document.getElementById('winText');
    text.textContent = (winner==='red' ? '红方获胜！' : '蓝方获胜！');
    overlay.classList.add('show');
  }`
const SHOW_WIN_PATCHED = `function showWin(winner){
    const overlay = document.getElementById('winOverlay');
    const text = document.getElementById('winText');
    text.textContent = (winner==='red' ? L.winRed : L.winBlue);
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
html = applyPatch(html, SHOW_WIN_ORIGINAL, SHOW_WIN_PATCHED, 'showWin 多语言化 + postMessage 上报')

await writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8')
console.log('✓ index.html（png→webp、postMessage 上报、中英文 i18n 全部接好）')

console.log('\n完成，全部输出到 public/games/dou-shou-qi/')
