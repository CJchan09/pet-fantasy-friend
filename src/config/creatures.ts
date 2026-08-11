import type { CreatureRarity } from '@/types'

/**
 * 生物档案与美术资产索引。
 * 资产由 scripts/convertCreatures.mjs 从设计侧 PNG 生成，位于 public/creatures/。
 *
 * 稀有度规划（CJ 2026-08-10 决定）：
 * - 当前 6 只全部是 common：只有一个形态（maxStage: 1），孵出来就是最终样子。
 * - 未来「更强」的生物用 rare / legendary：maxStage 2–3，可以随成长进化成不同的样子，
 *   届时设计侧需交付对应生物的 S2/S3 阶段美术，加进 CREATURES 并把 maxStage 调到对应值即可，
 *   抽蛋池、图鉴、稀有度标签都会自动跟上（都是从这份配置派生的）。
 */

export type CreatureState =
  | 'active'
  | 'tired'
  | 'dormant'
  | 'joy'
  | 'eyes-open'
  | 'eyes-closed'

export interface CreatureDef {
  slug: string
  /** i18n key：物种名（如 森之幼熊） */
  speciesKey: string
  /** i18n key：场景氛围标签（如 苔原 · 黄昏） */
  sceneKey: string
  /** 默认昵称（用户数据，起始三选一时可自定义覆盖） */
  defaultName: string
  rarity: CreatureRarity
  /**
   * 进化形态数量。1 = 只有一个样子（当前所有 common）；
   * 未来更强的生物 >1，等级到阈值后立绘切到 S2/S3（美术就位后实现切换逻辑）。
   */
  maxStage: number
}

export const CREATURES: Record<string, CreatureDef> = {
  mossbear: {
    slug: 'mossbear',
    speciesKey: 'creature.mossbear.species',
    sceneKey: 'creature.mossbear.scene',
    defaultName: '苔苔',
    rarity: 'common',
    maxStage: 1,
  },
  spiritfox: {
    slug: 'spiritfox',
    speciesKey: 'creature.spiritfox.species',
    sceneKey: 'creature.spiritfox.scene',
    defaultName: '小灵',
    rarity: 'common',
    maxStage: 1,
  },
  cloudsheep: {
    slug: 'cloudsheep',
    speciesKey: 'creature.cloudsheep.species',
    sceneKey: 'creature.cloudsheep.scene',
    defaultName: '云云',
    rarity: 'common',
    maxStage: 1,
  },
  mistdeer: {
    slug: 'mistdeer',
    speciesKey: 'creature.mistdeer.species',
    sceneKey: 'creature.mistdeer.scene',
    defaultName: '雾雾',
    rarity: 'common',
    maxStage: 1,
  },
  streamturtle: {
    slug: 'streamturtle',
    speciesKey: 'creature.streamturtle.species',
    sceneKey: 'creature.streamturtle.scene',
    defaultName: '溪溪',
    rarity: 'common',
    maxStage: 1,
  },
  stardragon: {
    slug: 'stardragon',
    speciesKey: 'creature.stardragon.species',
    sceneKey: 'creature.stardragon.scene',
    defaultName: '星岚',
    rarity: 'common',
    maxStage: 1,
  },
}

export const DEFAULT_SPECIES = 'mossbear'

/**
 * 首次进入的起始名单（CJ 2026-08-11 改版：6 只里除星岚龙外全部 5 只都可选）。
 * 星岚龙（stardragon）刻意不放进起始名单——它是留给抽蛋系统的「隐藏」生物，
 * 只能在开局之后通过孵化遇见，营造「还有一只没见过」的悬念。
 */
export const STARTER_SPECIES = ['mossbear', 'spiritfox', 'cloudsheep', 'mistdeer', 'streamturtle']

export const CREATURES_BY_RARITY: Record<CreatureRarity, string[]> = {
  common: Object.values(CREATURES)
    .filter((c) => c.rarity === 'common')
    .map((c) => c.slug),
  rare: Object.values(CREATURES)
    .filter((c) => c.rarity === 'rare')
    .map((c) => c.slug),
  legendary: Object.values(CREATURES)
    .filter((c) => c.rarity === 'legendary')
    .map((c) => c.slug),
}

/**
 * 拼 BASE_URL 而不是硬编码前导斜杠：GitHub Pages 项目站点跑在 /pet-fantasy-friend/ 子路径下，
 * 硬编码 /creatures/... 在子路径部署时会 404（见 vite.config.ts 的 base 设置）。
 */
export function creatureAsset(
  species: string,
  state: CreatureState,
  stage: number = 1,
): string {
  return `${import.meta.env.BASE_URL}creatures/${species}_s${stage}_${state}.webp`
}

/**
 * 蛋美术资产：由 scripts/convertEggAssets.mjs 从设计侧 PNG（../Image/Egg/）抠透明背景转出，
 * 位于 public/eggs/。抽蛋时物种已定，所以孵化中直接显示对应生物的蛋（不是通用「神秘蛋」占位）。
 */
export function eggAsset(species: string): string {
  return `${import.meta.env.BASE_URL}eggs/${species}.webp`
}
