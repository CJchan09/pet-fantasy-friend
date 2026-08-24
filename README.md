# Pet Fantasy Friend

Web 端奇幻宠物养成应用。产品文档见上级目录 `../docs/`（PRD / Roadmap / User_Story_Map / Metrics / Claude_Code_Prompt）。

**在线试玩**：https://cjchan09.github.io/pet-fantasy-friend/

本仓库当前范围：**阶段一（v0.1 核心循环）+ 阶段二（v0.5 功能完整）+ 账号系统**——反思、专注、自定义任务三种赚星尘方式，喂养/升级，孵化系统，宠物状态机（活跃/疲倦/沉睡/唤醒），图鉴，存档导出/导入，Supabase 账号登录 + 云端存档同步。**不含** v1.0 的周回顾报告与付费墙/订阅（见文末「还没做」）。

已接入正式美术与设计系统：
- **宠物立绘**：20 只宠物均有幼年、成年、老年、仙人级四阶段，以及睁眼、闭眼、走路、疲倦、沉睡状态。`scripts/buildActionAssets.mjs` 负责统一透明背景、500×500 画布和主体视觉尺寸，输出到 `public/creatures/`。
- **视觉规范**：色板/圆角/阴影取自 `../游戏网页设计构思-handoff/`（暖奶油底 + 星尘暖金强调色），布局与文案遵循 `../Image/UI稿_AI生成/_UI规格说明.md`。
- **动画**：待机随机眨眼（3.5–7 秒随机间隔，闭眼停留 650ms）与偶发走路动作，帧间使用短交叉淡化；喂养时切喜悦帧；疲倦/沉睡态使用对应美术；星光粒子闪烁 + 宠物呼吸浮动，沉睡时停止（`prefers-reduced-motion` 时全部停用）。
- **专注环境音**：专注页提供棕噪、雨夜、海潮三种程序化声景及独立音量控制，默认静音。声音通过 Web Audio API 在设备上实时合成，不下载外部曲目、不接第三方音乐 API，也没有音频版权或持续调用费用；结束专注或离开页面时自动停止。
- **网站图标**：设计侧交付的蛋形 Logo（`../Image/logo/`）经 `scripts/generateIcons.mjs` 裁切/生成 favicon、apple-touch-icon、PWA manifest 图标（含 maskable 变体），输出到 `public/`。源图四周留白很多，脚本按小尺寸场景（favicon 等）裁紧、按需要安全边距的场景（maskable）保留原始留白，两种都不用手动再调。Logo 更新后重跑该脚本即可。

**小游戏——斗兽棋**：CJ 自己做的独立 HTML5 小游戏（`../dou-shou-qi/`，支持人机对战 + 本地双人对战），经 `scripts/convertAnimalChessAssets.mjs` 转 WebP（13MB → 352KB，顺便去掉了代码里未引用的全身图美术）后嵌入 `public/games/dou-shou-qi/`，主界面加一个入口按钮，用 `<iframe>` 打开。赢一局给 10 ⭐（每日最多 2 次），输了不扣分；游戏结束时通过 `postMessage` 把结果报给外层 React 页面，由外层决定要不要发星尘——游戏本身不需要知道任何星尘逻辑。游戏原本文案全是中文硬编码，同一个转换脚本又给它接了一套独立的中英 i18n（跟 App 那套 react-i18next 各自独立，不共用同一份文案文件），`AnimalChessScreen.tsx` 用当前 App 语言拼 `?lang=en` / `?lang=zh-CN` 传给 iframe，两边语言联动。

⚠️ **产品原则提醒**：PRD 1.3 写明「星尘只能靠真实的成长行为赚取」，这条奖励技术上突破了这条硬性原则，是 CJ 明确要求加的。为了不让它变成新的主要刷币入口：数值压得很低（10⭐，远低于反思的 40⭐）、每日上限 2 次、不计入 `gameBalance.ts` 里 PRIMARY/SECONDARY 的平衡红线对比、也不算「成长行为」（不会唤醒沉睡的宠物）。如果不想要这个例外，回退方式很简单：删掉 `useGameStore.ts` 里 `recordAnimalChessResult` 对 `stardust` 的那行赋值即可，游戏本身完全不受影响。

## 技术栈

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + react-i18next + vite-plugin-pwa + Vitest + Supabase（Auth + Postgres）。部署：GitHub Actions 构建 → GitHub Pages（`.github/workflows/deploy.yml`，push 到 `main` 自动重新部署）。

## 本地运行

先在项目根目录建一个 `.env.local`（已在 `.gitignore` 里，不会被提交）：

```
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase publishable/anon key
```

两个值在 Supabase Dashboard → Settings → API Keys 里找。这两个值设计上就是给客户端公开用的（不是密码），放进 `.env.local` 只是为了不硬编码进代码。

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run test      # 跑 Vitest（domain / storage / store / component 单测，124 个）
npm run build     # 生产构建（tsc -b && vite build）
npm run preview   # 预览生产构建
```

**生产部署**（GitHub Actions）额外需要在仓库 Settings → Secrets and variables → Actions 里配置同样的两个值（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`），`.github/workflows/deploy.yml` 会在构建时注入。

## 目录结构

```
src/
├── config/
│   ├── gameBalance.ts    # 全部数值常量：星尘经济、平衡红线、孵化成本、宠物状态机天数阈值
│   └── creatures.ts      # 20 种生物档案（含稀有度）+ 四阶段资产路径索引
├── domain/                # 纯业务逻辑，不依赖 React
│   ├── stardust.ts / reflection.ts / pet.ts       # 阶段一
│   ├── tasks.ts / focus.ts / incubation.ts / petLifecycle.ts   # 阶段二
│   ├── animalChess.ts     # 斗兽棋结果 -> 是否发星尘的纯判定逻辑
│   ├── cloudSync.ts       # 登录时本机存档 vs 云端存档的合并规则（纯函数，不含 Supabase 调用本身）
│   └── __tests__/
├── lib/
│   ├── supabaseClient.ts  # Supabase 客户端单例
│   └── cloudSync.ts       # 副作用编排：session 变化 → 拉取/合并/推送云端存档（见 App.tsx 里的 initCloudSync()）
├── storage/localStorageAdapter.ts  # localStorage 读写、schemaVersion（现为 5）迁移、导出/导入 JSON
├── store/
│   ├── useGameStore.ts    # 唯一持久化 store，全部 AppState 一起读写 localStorage（+ 登录后同步云端）
│   ├── useAuthStore.ts    # 登录状态、role（普通/admin）、注册/登录/登出 action
│   ├── useFocusTimerStore.ts  # 专注倒计时，特意不持久化（刷新=中断，荣誉制）
│   └── use*Store.ts       # 按域派生的选择器（Pet/Stardust/Reflection/Task/Focus/Egg/Dex/Settings/AnimalChess）
├── i18n/                  # react-i18next 配置 + zh-CN.json（简体，先行）+ en.json
├── components/            # UI 组件（pet/、reflection/、incubation/、stardust/）
└── screens/                # LoginScreen / HomeScreen / ReflectionScreen / ReflectionHistoryScreen /
                              StarterPickerScreen / FocusScreen / TasksScreen / DexScreen /
                              SettingsScreen / AnimalChessScreen
scripts/
├── convertCreatures.mjs         # 美术资产管线：设计侧 PNG → public/creatures/*.webp
├── convertEggAssets.mjs         # 蛋美术管线：设计侧 PNG（../Image/Egg/）抠透明背景 → public/eggs/*.webp
├── generateIcons.mjs            # 网站图标管线：设计侧 Logo → public/*.png + favicon.svg
└── convertAnimalChessAssets.mjs # 斗兽棋资产管线：../dou-shou-qi/ → public/games/dou-shou-qi/
public/games/dou-shou-qi/  # 嵌入的斗兽棋小游戏（独立 HTML，iframe 加载，见 AnimalChessScreen.tsx）
supabase/schema.sql        # 数据库结构（profiles 表 + RLS + role 保护触发器），贴进 Supabase SQL Editor 执行
```

## 已做的判断（PRD 未给出具体数值 / 方案之处）

- **喂养数值**：`FEED_STARDUST_COST=10` 换 `FEED_INTIMACY_GAIN=10` 亲密度，`INTIMACY_PER_LEVEL=50` 升一级。
- **反思空白字符判定**：按去除首尾空白后长度 > 0 判断，不是严格按字符数。
- **单一 Zustand store**：`useGameStore` 是唯一持久化 store，其余 `use*Store` 都是派生选择器，避免多个 store 各自持久化互相覆盖同一个 localStorage key。
- **20 种生物与稀有度**：Common 10 只、Epic 6 只、Legend 4 只；所有生物均有四阶段美术。抽蛋池、图鉴与稀有度标签都从 `config/creatures.ts` 派生。
- **起始名单**：首次进入固定三选一（苔藓熊、灵狐、云羊）；其余 17 只只能通过抽蛋逐步取得。
- **等级与进化**：等级上限 50；1–19 幼年、20–29 成年、30–39 老年、40–50 仙人级。旧版卡在 Level 5 的存档会按亲密度自动修复。
- **孵化流程（CJ 2026-08-10 改版，抽蛋制；2026-08-11 调整揭晓时机）**：按「抽一颗蛋」→ 抽的瞬间就确定蛋里是什么生物，**直接显示**对应生物的蛋美术和名字（不做「神秘蛋」悬念）→ 星尘浇灌进度条（20⭐/次，攒满 60⭐ 孵化）。抽蛋池只有未拥有的生物，**每只生物永远只有一只，不会重复**；全部集齐后显示「都到齐了」。抽蛋免费、进度确定性推进、最终必集齐——不违反 PRD「不做付费随机抽取」的原则，随机只发生在「哪只先来」。抽蛋动画刻意收敛（蛋落巢晃两下），不做开箱式悬念。蛋美术来自 `scripts/convertEggAssets.mjs`（设计侧 PNG `../Image/Egg/` 抠透明背景转 WebP，输出到 `public/eggs/`）。
- **孵化起名弹窗（CJ 2026-08-12 加，`schemaVersion` 4→5）**：浇灌进度到达成本、真正孵化出来的那一刻（不是抽蛋时）强制弹窗报生物名字，输入框预填默认名，点确认即可（默认名也能直接用），弹窗没有背景点击/右上角关闭——这是刻意补的体验缺口，不做成能悄悄跳过的静默流程。`ownedCreatures` 从 `Record<string, boolean>` 改成 `Record<string, {nickname}>`，图鉴显示的是昵称而不是固定物种名；旧存档迁移时当前陪伴宠物用 `pet.name` 当默认昵称，其余用生物原名。
- **自定义任务模型**：一次性待办（不是每日重置的习惯打卡），每个任务只发一次星尘。
- **蛋位数量**：先给 1 个（Free 档基础值），不引入没有解锁路径的「锁定第二蛋位」UI（订阅系统还没做）。
- **专注计时**：倒计时本身不持久化（刷新=中断，不惩罚），但「今日已完成几次」持久化，避免刷新绕过每日上限。
- **专注环境音**：不用 AI 音乐平台生成完整歌曲，也不存放大型音频文件；`audio/proceduralSoundscape.ts` 用 Web Audio API 实时产生棕噪、雨夜与海潮，内部循环做平滑收尾，切换/停止时做短淡化以避免爆音。该引擎可直接复用于未来的睡前安静模式。
- **中文文案**：简体中文。
- **斗兽棋奖励数值**：赢一局 10⭐、每日上限 2 次（20⭐/天）。这是 CJ 后加的需求，跟 PRD「星尘只能靠成长行为赚取」的原则有张力，数值刻意压低+设上限，详见上文「小游戏」小节的产品原则提醒。
- **账号系统（CJ 2026-08-12 加，推翻 PRD「日记不出设备」原则）**：Supabase Auth（邮箱密码 + Google）+ Postgres。存档结构沿用现有「单一 JSON blob」模式——`profiles.game_state` 直接存整个 `AppState`，不拆表，改动面最小。未登录不能进游戏主流程。登录时的合并规则（`domain/cloudSync.ts` 的 `resolveLoginMerge`）：账号云端还没有存档（没做过起始三选一）→ 用本机的覆盖上去并立刻推送；账号云端已有进度 → 保留云端，本机不覆盖。**Admin 测试账号**：`profiles.role` 字段，只能在 Supabase SQL Editor 里手动设（`supabase/schema.sql` 底部有现成语句），前端/API 都改不了自己的 role（`prevent_role_self_update` 触发器挡住）——登录后跳过反思/任务/专注/斗兽棋全部每日上限，`SettingsScreen.tsx` 里还有一个「直接加星尘」的调试面板，仅 admin 可见。**重要**：`public.profiles` 表虽然有 RLS policy，但 SQL Editor 建表时不会自动带上 Postgres 的表级 GRANT（RLS 管「哪些行能看」，GRANT 管「这张表本身能不能被这个角色碰」，是两层不同的权限），`schema.sql` 已经补上 `grant select, insert, update on public.profiles to authenticated`，如果以后又出现「SQL Editor 里查都正常、前端却读不到」的情况，先怀疑这层。
- **语言选择（CJ 2026-08-19 反馈改版）**：进 App 最前面先问语言（`LanguagePickerScreen.tsx`，登录墙之前），选完全程生效，不用在每个页面都摆语言切换 button——只在 Settings 保留一个。判断「要不要问」的标准是这台设备有没有出现过 `pet-fantasy-friend:save` 这个 localStorage key（`useLanguageGateStore.ts`），老用户不会被这一步打断。生物默认昵称（起始三选一/孵化起名弹窗的预填值）跟着改成 `config/creatures.ts` 的 `defaultNameKey`（i18n key，不是写死的中文字符串），语言切换后预填名字会跟着变；**已经确认的昵称是用户数据，不会因为切语言而重新翻译**。
- **图鉴出战切换（CJ 2026-08-19 反馈新增）**：图鉴不只是收藏墙，点已拥有的生物格子可以把主界面出战的伙伴切成它（`switchActivePet`），出战中的那只用金色描边标出。当前实现：亲密度/等级是跟着「出战宠物」这个位置走的单一数值，不是每只生物各自累计——切换只改显示，不会把等级也带过去或清零；如果以后要做「每只生物独立成长」，`ownedCreatures` 需要连亲密度/等级一起存，是更大的数据结构改动，这次先不做。
- **Bug 修复（2026-08-19）**：`localStorageAdapter.ts` 的 `migrate()` 曾经在 `ownedCreatures` 为空时无条件把 `pet.species`（起始三选一还没选完时只是占位的默认苔熊）记成已拥有，导致选别的生物开局后图鉴里仍会多出一只没养过的熊——修复为只在真的选过起始宠物（`hasChosenStarter===true` 或 legacy v1 存档）时才生效这条兜底逻辑。

## 还没做（v0.5 之后 / 本次范围之外）

- **周回顾报告**（v1.0 / P1）——本地生成 + 导出图片，纯代码可做，还没做
- **付费墙 / 订阅**（v1.0 / P1）——需要先注册 Merchant of Record 账号（如 Lemon Squeezy）并决定定价，这部分需要 CJ 先做账号与定价决定
- **落地页、正式埋点**（v1.0 / P1）
- **宠物改名**——首次三选一之后不能再改名字
