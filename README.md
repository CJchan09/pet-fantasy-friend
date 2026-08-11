# Pet Fantasy Friend

Web 端奇幻宠物养成应用。产品文档见上级目录 `../docs/`（PRD / Roadmap / User_Story_Map / Metrics / Claude_Code_Prompt）。

**在线试玩**：https://cjchan09.github.io/pet-fantasy-friend/

本仓库当前范围：**阶段一（v0.1 核心循环）+ 阶段二（v0.5 功能完整）**——反思、专注、自定义任务三种赚星尘方式，喂养/升级，孵化系统，宠物状态机（活跃/疲倦/沉睡/唤醒），图鉴，存档导出/导入。**不含** v1.0 的周回顾报告与付费墙/订阅（见文末「还没做」）。

已接入正式美术与设计系统：
- **宠物立绘**：设计侧 PNG（`../Image/宠物png/`）经 `scripts/convertCreatures.mjs` 转成 WebP（约 5MB/张 → 23–50KB/张），输出到 `public/creatures/`。设计侧更新 PNG 后重跑该脚本即可。
- **视觉规范**：色板/圆角/阴影取自 `../游戏网页设计构思-handoff/`（暖奶油底 + 星尘暖金强调色），布局与文案遵循 `../Image/UI稿_AI生成/_UI规格说明.md`。
- **动画**：待机随机眨眼（睁眼/闭眼两帧姿势对齐，3.5–7 秒随机间隔）；喂养时切喜悦帧 2.2 秒；疲倦/沉睡态用真实的对应美术（不眨眼）；星光粒子闪烁 + 宠物呼吸浮动，沉睡时停止（`prefers-reduced-motion` 时全部停用）。
- **网站图标**：设计侧交付的蛋形 Logo（`../Image/logo/`）经 `scripts/generateIcons.mjs` 裁切/生成 favicon、apple-touch-icon、PWA manifest 图标（含 maskable 变体），输出到 `public/`。源图四周留白很多，脚本按小尺寸场景（favicon 等）裁紧、按需要安全边距的场景（maskable）保留原始留白，两种都不用手动再调。Logo 更新后重跑该脚本即可。

**小游戏——斗兽棋**：CJ 自己做的独立 HTML5 小游戏（`../dou-shou-qi/`，支持人机对战 + 本地双人对战），经 `scripts/convertAnimalChessAssets.mjs` 转 WebP（13MB → 352KB，顺便去掉了代码里未引用的全身图美术）后嵌入 `public/games/dou-shou-qi/`，主界面加一个入口按钮，用 `<iframe>` 打开。赢一局给 10 ⭐（每日最多 2 次），输了不扣分；游戏结束时通过 `postMessage` 把结果报给外层 React 页面，由外层决定要不要发星尘——游戏本身不需要知道任何星尘逻辑。游戏原本文案全是中文硬编码，同一个转换脚本又给它接了一套独立的中英 i18n（跟 App 那套 react-i18next 各自独立，不共用同一份文案文件），`AnimalChessScreen.tsx` 用当前 App 语言拼 `?lang=en` / `?lang=zh-CN` 传给 iframe，两边语言联动。

⚠️ **产品原则提醒**：PRD 1.3 写明「星尘只能靠真实的成长行为赚取」，这条奖励技术上突破了这条硬性原则，是 CJ 明确要求加的。为了不让它变成新的主要刷币入口：数值压得很低（10⭐，远低于反思的 40⭐）、每日上限 2 次、不计入 `gameBalance.ts` 里 PRIMARY/SECONDARY 的平衡红线对比、也不算「成长行为」（不会唤醒沉睡的宠物）。如果不想要这个例外，回退方式很简单：删掉 `useGameStore.ts` 里 `recordAnimalChessResult` 对 `stardust` 的那行赋值即可，游戏本身完全不受影响。

## 技术栈

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + react-i18next + vite-plugin-pwa + Vitest。部署：GitHub Actions 构建 → GitHub Pages（`.github/workflows/deploy.yml`，push 到 `main` 自动重新部署）。

## 本地运行

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run test      # 跑 Vitest（domain / storage / store 单测，90 个）
npm run build     # 生产构建（tsc -b && vite build）
npm run preview   # 预览生产构建
```

## 目录结构

```
src/
├── config/
│   ├── gameBalance.ts    # 全部数值常量：星尘经济、平衡红线、孵化成本、宠物状态机天数阈值
│   └── creatures.ts      # 6 种生物档案（含稀有度）+ 资产路径索引
├── domain/                # 纯业务逻辑，不依赖 React
│   ├── stardust.ts / reflection.ts / pet.ts       # 阶段一
│   ├── tasks.ts / focus.ts / incubation.ts / petLifecycle.ts   # 阶段二
│   ├── animalChess.ts     # 斗兽棋结果 -> 是否发星尘的纯判定逻辑
│   └── __tests__/
├── storage/localStorageAdapter.ts  # localStorage 读写、schemaVersion（现为 3）迁移、导出/导入 JSON
├── store/
│   ├── useGameStore.ts    # 唯一持久化 store，全部 AppState 一起读写 localStorage
│   ├── useFocusTimerStore.ts  # 专注倒计时，特意不持久化（刷新=中断，荣誉制）
│   └── use*Store.ts       # 按域派生的选择器（Pet/Stardust/Reflection/Task/Focus/Egg/Dex/Settings）
├── i18n/                  # react-i18next 配置 + zh-CN.json（简体，先行）+ en.json
├── components/            # UI 组件（pet/、reflection/、incubation/、stardust/）
└── screens/                # HomeScreen / ReflectionScreen / ReflectionHistoryScreen /
                              StarterPickerScreen / FocusScreen / TasksScreen / DexScreen /
                              SettingsScreen / AnimalChessScreen
scripts/
├── convertCreatures.mjs         # 美术资产管线：设计侧 PNG → public/creatures/*.webp
├── generateIcons.mjs            # 网站图标管线：设计侧 Logo → public/*.png + favicon.svg
└── convertAnimalChessAssets.mjs # 斗兽棋资产管线：../dou-shou-qi/ → public/games/dou-shou-qi/
public/games/dou-shou-qi/  # 嵌入的斗兽棋小游戏（独立 HTML，iframe 加载，见 AnimalChessScreen.tsx）
```

## 已做的判断（PRD 未给出具体数值 / 方案之处）

- **喂养数值**：`FEED_STARDUST_COST=10` 换 `FEED_INTIMACY_GAIN=10` 亲密度，`INTIMACY_PER_LEVEL=50` 升一级。
- **反思空白字符判定**：按去除首尾空白后长度 > 0 判断，不是严格按字符数。
- **单一 Zustand store**：`useGameStore` 是唯一持久化 store，其余 `use*Store` 都是派生选择器，避免多个 store 各自持久化互相覆盖同一个 localStorage key。
- **6 种生物稀有度（CJ 2026-08-10 改版）**：当前 6 只**全部是 common**、只有一个形态（`maxStage: 1`）。未来「更强」的生物走 rare/legendary，`maxStage` 2–3，可随成长进化成不同的样子——美术就位后在 `config/creatures.ts` 加条目即可，抽蛋池/图鉴/稀有度标签都从这份配置派生，自动跟上。之前的 3/2/1 分级和「星岚龙 30 次反思里程碑解锁」暂时下线（`checkLegendaryUnlock` 通道保留在代码里，等未来有 legendary 生物时直接复用）。
- **孵化流程（CJ 2026-08-10 改版，抽蛋制）**：按「抽一颗蛋」→ 抽的瞬间就确定蛋里是什么生物（对玩家保密到孵化）→ 星尘浇灌进度条（20⭐/次，攒满 60⭐ 孵化）。抽蛋池只有未拥有的生物，**每只生物永远只有一只，不会重复**；全部集齐后显示「都到齐了」。抽蛋免费、进度确定性推进、最终必集齐——不违反 PRD「不做付费随机抽取」的原则，随机只发生在「哪只先来」。抽蛋动画刻意收敛（蛋落巢晃两下），不做开箱式悬念。
- **自定义任务模型**：一次性待办（不是每日重置的习惯打卡），每个任务只发一次星尘。
- **蛋位数量**：先给 1 个（Free 档基础值），不引入没有解锁路径的「锁定第二蛋位」UI（订阅系统还没做）。
- **专注计时**：倒计时本身不持久化（刷新=中断，不惩罚），但「今日已完成几次」持久化，避免刷新绕过每日上限。
- **中文文案**：简体中文。
- **斗兽棋奖励数值**：赢一局 10⭐、每日上限 2 次（20⭐/天）。这是 CJ 后加的需求，跟 PRD「星尘只能靠成长行为赚取」的原则有张力，数值刻意压低+设上限，详见上文「小游戏」小节的产品原则提醒。

## 还没做（v0.5 之后 / 本次范围之外）

- **进化 2/3 阶段视觉**——设计侧只交付了 S1 美术，等级会涨但外观暂时不随进化阶段变化
- **出战宠物切换**——孵化出的新生物只进图鉴收藏，不能设为主界面陪伴对象
- **周回顾报告**（v1.0 / P1）——本地生成 + 导出图片，纯代码可做，还没做
- **付费墙 / 订阅**（v1.0 / P1）——需要先注册 Merchant of Record 账号（如 Lemon Squeezy）并决定定价，这部分需要 CJ 先做账号与定价决定
- **落地页、正式埋点**（v1.0 / P1）
- **宠物改名**——首次三选一之后不能再改名字
