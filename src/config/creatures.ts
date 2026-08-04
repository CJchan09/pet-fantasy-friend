/**
 * 生物档案与美术资产索引。
 * 资产由 scripts/convertCreatures.mjs 从设计侧 PNG 生成，位于 public/creatures/。
 * 阶段一只用到 mossbear（初始宠物）；其余 5 种为阶段二孵化/图鉴预留。
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
  /** 默认昵称（用户数据，阶段二开放改名） */
  defaultName: string
}

export const CREATURES: Record<string, CreatureDef> = {
  mossbear: {
    slug: 'mossbear',
    speciesKey: 'creature.mossbear.species',
    sceneKey: 'creature.mossbear.scene',
    defaultName: '苔苔',
  },
  spiritfox: {
    slug: 'spiritfox',
    speciesKey: 'creature.spiritfox.species',
    sceneKey: 'creature.spiritfox.scene',
    defaultName: '小灵',
  },
  cloudsheep: {
    slug: 'cloudsheep',
    speciesKey: 'creature.cloudsheep.species',
    sceneKey: 'creature.cloudsheep.scene',
    defaultName: '云云',
  },
  stardragon: {
    slug: 'stardragon',
    speciesKey: 'creature.stardragon.species',
    sceneKey: 'creature.stardragon.scene',
    defaultName: '星岚',
  },
  mistdeer: {
    slug: 'mistdeer',
    speciesKey: 'creature.mistdeer.species',
    sceneKey: 'creature.mistdeer.scene',
    defaultName: '雾雾',
  },
  streamturtle: {
    slug: 'streamturtle',
    speciesKey: 'creature.streamturtle.species',
    sceneKey: 'creature.streamturtle.scene',
    defaultName: '溪溪',
  },
}

export const DEFAULT_SPECIES = 'mossbear'

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
