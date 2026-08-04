import type { CreatureRarity } from '@/types'

/**
 * 生物档案与美术资产索引。
 * 资产由 scripts/convertCreatures.mjs 从设计侧 PNG 生成，位于 public/creatures/。
 * 美术现状：只有 S1（第一阶段）美术，没有 S2/S3 进化阶段外观——等级会涨，
 * 但目前立绘不会随进化阶段切换，见 README「还没做」清单。
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
}

export const CREATURES: Record<string, CreatureDef> = {
  mossbear: {
    slug: 'mossbear',
    speciesKey: 'creature.mossbear.species',
    sceneKey: 'creature.mossbear.scene',
    defaultName: '苔苔',
    rarity: 'common',
  },
  spiritfox: {
    slug: 'spiritfox',
    speciesKey: 'creature.spiritfox.species',
    sceneKey: 'creature.spiritfox.scene',
    defaultName: '小灵',
    rarity: 'common',
  },
  cloudsheep: {
    slug: 'cloudsheep',
    speciesKey: 'creature.cloudsheep.species',
    sceneKey: 'creature.cloudsheep.scene',
    defaultName: '云云',
    rarity: 'common',
  },
  mistdeer: {
    slug: 'mistdeer',
    speciesKey: 'creature.mistdeer.species',
    sceneKey: 'creature.mistdeer.scene',
    defaultName: '雾雾',
    rarity: 'rare',
  },
  streamturtle: {
    slug: 'streamturtle',
    speciesKey: 'creature.streamturtle.species',
    sceneKey: 'creature.streamturtle.scene',
    defaultName: '溪溪',
    rarity: 'rare',
  },
  stardragon: {
    slug: 'stardragon',
    speciesKey: 'creature.stardragon.species',
    sceneKey: 'creature.stardragon.scene',
    defaultName: '星岚',
    rarity: 'legendary',
  },
}

export const DEFAULT_SPECIES = 'mossbear'

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
