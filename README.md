# Pet Fantasy Friend

Web 端奇幻宠物养成应用。产品文档见上级目录 `../docs/`（PRD / Roadmap / User_Story_Map / Metrics / Claude_Code_Prompt）。

**在线试玩**：https://cjchan09.github.io/pet-fantasy-friend/

本仓库当前范围：**阶段一（v0.1 核心循环）+ 阶段二（v0.5 功能完整）**——反思、专注、自定义任务三种赚星尘方式，喂养/升级，孵化系统，宠物状态机（活跃/疲倦/沉睡/唤醒），图鉴，存档导出/导入。**不含** v1.0 的周回顾报告与付费墙/订阅（见文末「还没做」）。

已接入正式美术与设计系统：
- **宠物立绘**：设计侧 PNG（`../Image/宠物png/`）经 `scripts/convertCreatures.mjs` 转成 WebP（约 5MB/张 → 23–50KB/张），输出到 `public/creatures/`。设计侧更新 PNG 后重跑该脚本即可。
- **视觉规范**：色板/圆角/阴影取自 `../游戏网页设计构思-handoff/`（暖奶油底 + 星尘暖金强调色），布局与文案遵循 `../Image/UI稿_AI生成/_UI规格说明.md`。
- **动画**：待机随机眨眼（睁眼/闭眼两帧姿势对齐，3.5–7 秒随机间隔）；喂养时切喜悦帧 2.2 秒；疲倦/沉睡态用真实的对应美术（不眨眼）；星光粒子闪烁 + 宠物呼吸浮动，沉睡时停止（`prefers-reduced-motion` 时全部停用）。

## 技术栈

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + react-i18next + vite-plugin-pwa + Vitest。部署：GitHub Actions 构建 → GitHub Pages（`.github/workflows/deploy.yml`，push 到 `main` 自动重新部署）。

## 本地运行

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run test      # 跑 Vitest（domain / storage / store 单测，78 个）
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
│   └── __tests__/
├── storage/localStorageAdapter.ts  # localStorage 读写、schemaVersion（现为 2）迁移、导出/导入 JSON
├── store/
│   ├── useGameStore.ts    # 唯一持久化 store，全部 AppState 一起读写 localStorage
│   ├── useFocusTimerStore.ts  # 专注倒计时，特意不持久化（刷新=中断，荣誉制）
│   └── use*Store.ts       # 按域派生的选择器（Pet/Stardust/Reflection/Task/Focus/Egg/Dex/Settings）
├── i18n/                  # react-i18next 配置 + zh-CN.json（简体，先行）+ en.json
├── components/            # UI 组件（pet/、reflection/、incubation/、stardust/）
└── screens/                # HomeScreen / ReflectionScreen / ReflectionHistoryScreen /
                              StarterPickerScreen / FocusScreen / TasksScreen / DexScreen / SettingsScreen
scripts/convertCreatures.mjs   # 美术资产管线：设计侧 PNG → public/creatures/*.webp
```

## 已做的判断（PRD 未给出具体数值 / 方案之处）

- **喂养数值**：`FEED_STARDUST_COST=10` 换 `FEED_INTIMACY_GAIN=10` 亲密度，`INTIMACY_PER_LEVEL=50` 升一级。
- **反思空白字符判定**：按去除首尾空白后长度 > 0 判断，不是严格按字符数。
- **单一 Zustand store**：`useGameStore` 是唯一持久化 store，其余 `use*Store` 都是派生选择器，避免多个 store 各自持久化互相覆盖同一个 localStorage key。
- **6 种生物稀有度**：Common 苔熊/灵狐/云羊，Rare 雾角鹿/溪石龟，Legendary 星岚龙（PRD 只定了数量 3/2/1，没定具体是谁）。
- **孵化数值**：普通蛋 60⭐、稀有蛋 150⭐、每次浇灌 20⭐、传说生物累计 30 次反思解锁（最后一个是 PRD 原文数字，其余是本次落地决定）。
- **自定义任务模型**：一次性待办（不是每日重置的习惯打卡），每个任务只发一次星尘。
- **蛋位数量**：先给 1 个（Free 档基础值），不引入没有解锁路径的「锁定第二蛋位」UI（订阅系统还没做）。
- **专注计时**：倒计时本身不持久化（刷新=中断，不惩罚），但「今日已完成几次」持久化，避免刷新绕过每日上限。
- **中文文案**：简体中文。

## 还没做（v0.5 之后 / 本次范围之外）

- **进化 2/3 阶段视觉**——设计侧只交付了 S1 美术，等级会涨但外观暂时不随进化阶段变化
- **出战宠物切换**——孵化出的新生物只进图鉴收藏，不能设为主界面陪伴对象
- **周回顾报告**（v1.0 / P1）——本地生成 + 导出图片，纯代码可做，还没做
- **付费墙 / 订阅**（v1.0 / P1）——需要先注册 Merchant of Record 账号（如 Lemon Squeezy）并决定定价，这部分需要 CJ 先做账号与定价决定
- **落地页、正式埋点**（v1.0 / P1）
- **宠物改名**——首次三选一之后不能再改名字
