# Pet Fantasy Friend

Web 端奇幻宠物养成应用。产品文档见上级目录 `../docs/`（PRD / Roadmap / User_Story_Map / Metrics / Claude_Code_Prompt）。

本仓库当前范围：**阶段一（Roadmap v0.1 核心循环）**——验证「成长行为 → 星尘 → 宠物变化」这个闭环，不含孵化/多宠物/沉睡/专注计时/自定义任务/周回顾/付费。

已接入正式美术与设计系统：
- **宠物立绘**：设计侧 PNG（`../Image/宠物png/`）经 `scripts/convertCreatures.mjs` 转成 WebP（约 5MB/张 → 23–50KB/张），输出到 `public/creatures/`。设计侧更新 PNG 后重跑该脚本即可。
- **视觉规范**：色板/圆角/阴影取自 `../游戏网页设计构思-handoff/`（暖奶油底 + 星尘暖金强调色），布局与文案遵循 `../Image/UI稿_AI生成/_UI规格说明.md`。
- **动画**：待机随机眨眼（睁眼/闭眼两帧姿势对齐，3.5–7 秒随机间隔）；喂养时切喜悦帧 2.2 秒；星光粒子闪烁 + 宠物呼吸浮动（`prefers-reduced-motion` 时停用）。

## 技术栈

React + TypeScript + Vite + Tailwind CSS v4 + Zustand + react-i18next + vite-plugin-pwa + Vitest。详细选型理由见交付说明（对话记录）或 `../docs/Claude_Code_Prompt.md` 的技术选型表。

## 本地运行

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm run test      # 跑 Vitest（domain / storage / store 单测）
npm run build     # 生产构建（tsc -b && vite build）
npm run preview   # 预览生产构建
```

## 目录结构

```
src/
├── config/gameBalance.ts      # 星尘经济数值常量 + 平衡红线（验收标准第 3 项）
├── config/creatures.ts        # 6 种生物档案 + 资产路径索引（阶段一只用 mossbear）
├── domain/                     # 纯业务逻辑，不依赖 React（stardust / reflection / pet）
├── storage/localStorageAdapter.ts  # localStorage 读写、schemaVersion、导出/导入 JSON
├── store/                      # Zustand：useGameStore 是唯一持久化 store，
│                                  usePetStore/useStardustStore/useReflectionStore 是按域派生的选择器
├── i18n/                       # react-i18next 配置 + zh-CN.json（简体，先行）+ en.json
├── components/                 # UI 组件（PetScene/PetSprite、反思表单、情绪选择器、历史列表）
└── screens/                    # HomeScreen / ReflectionScreen / ReflectionHistoryScreen
scripts/convertCreatures.mjs   # 美术资产管线：设计侧 PNG → public/creatures/*.webp
```

## 验收标准自测步骤（对应 `../docs/Claude_Code_Prompt.md` 阶段一 1–11）

1. **无需注册即可开始使用** —— `npm run dev` 打开即直接看到宠物主界面，无登录/注册页。
2. **反思可提交/编辑/回看，草稿实时保存，跨零点按本地日期归属**
   - 打开「写今日反思」，填写后不点提交，直接刷新页面 —— 内容应还在（草稿已实时存 localStorage）
   - 点「提交」拿星尘，再次进入反思页应显示已填内容，可修改后点「保存修改」
   - 「反思记录」页可看到历史条目
   - 跨零点归属：`getLocalDateKey()` 用 `Date` 的本地 getFullYear/getMonth/getDate，不是 `toISOString()`（UTC），已有单测覆盖（`src/domain/__tests__/reflection.test.ts`）
3. **同日重复提交不重复发放星尘，但可编辑内容** —— 见 `src/store/__tests__/useGameStore.test.ts`「同日重复提交」测试
4. **情绪标记可选填，不影响星尘发放，选完不出现任何评价或建议** —— `MoodPicker` 组件选择后只做高亮，无提示文案
5. **星尘余额正确增减，任何情况下不为负** —— `spendStardust` 扣减前校验，见 `src/domain/__tests__/stardust.test.ts`
6. **喂养消耗星尘、提升亲密度、达阈值升级** —— 首页「喂养」按钮，星尘不足时按钮禁用并显示提示
7. **存档结构含 `schemaVersion`，刷新页面数据不丢** —— 打开 DevTools → Application → Local Storage，键名 `pet-fantasy-friend:save`，可看到 `schemaVersion: 1`
8. **无任何硬编码面向用户的文案** —— 全部文案经 `useTranslation()` / `t()`，文案源见 `src/i18n/locales/zh-CN.json` 与 `en.json`
9. **打开浏览器 Network 面板走完全流程，零请求携带反思内容或情绪数据**（关键项）
   - 打开 DevTools → Network，勾选保留日志，完整走一遍「填反思 → 提交 → 喂养 → 查看历史」
   - 本项目全程无后端、无 `fetch`/`XMLHttpRequest` 调用，Network 面板应为空（除首次加载的静态资源）
10. **全站无「治疗/疗愈/缓解焦虑/心理健康」类表述** —— 检查 `src/i18n/locales/*.json`，文案基调为平静记录型
11. **iOS Safari + Android Chrome 实测可用，首屏 < 3 秒（4G）** —— 需要在真机或浏览器 DevTools 的移动模拟 + 网络节流下人工验证（本阶段未接入自动化性能测试）

## 已做的判断（PRD 未给出具体数值之处）

- **喂养数值**：PRD 未给出具体的「花多少星尘换多少亲密度」，本阶段决定为固定值 `FEED_STARDUST_COST=10` 换 `FEED_INTIMACY_GAIN=10` 亲密度，`INTIMACY_PER_LEVEL=50` 亲密度升一级，见 `src/config/gameBalance.ts` 注释。日后如需调整数值平衡，只改这个文件。
- **反思空白字符判定**：「每题最少 1 个字符即可提交」按去除首尾空白后长度 > 0 判断（避免用空格刷完成度），而非严格按字符数（包含空格）判断。
- **单一 Zustand store**：产品交接文档建议 `usePetStore` / `useStardustStore` / `useReflectionStore` 三个 store，但由于三者共享同一份 localStorage 存档，若各自独立持久化会互相覆盖对方刚写入的数据。改为一个 `useGameStore` 持有完整 `AppState` 并统一持久化，三个 hook 变成按域派生的选择器（选取所需字段 + 对应 action），对组件的调用方式基本不变。
- **中文文案**：确认使用简体中文（见对话记录）。

## 阶段一明确不做

孵化、多生物、沉睡状态机、专注计时器、自定义任务、周回顾、付费墙、账号系统、存档导出/导入 UI（Roadmap v0.5 范围）、正式美术资源生成。完成后请先验收，确认没问题再进入阶段二。
