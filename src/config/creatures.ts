import type { CreatureRarity } from '@/types'

/**
 * 生物档案与美术资产索引。
 * 资产由 scripts/convertCreatures.mjs 从设计侧 PNG 生成，位于 public/creatures/。
 *
 * 20 只新美术均有幼年、成年、老年、仙人级四阶段；游戏会根据等级加载 S1-S4。
 */

export type CreatureState =
  | 'active'
  | 'tired'
  | 'dormant'
  | 'joy'
  | 'eyes-open'
  | 'eyes-closed'
  | 'walk-a'
  | 'walk-b'

export interface CreatureDef {
  slug: string
  /** i18n key：物种名（如 森之幼熊） */
  speciesKey: string
  /** i18n key：场景氛围标签（如 苔原 · 黄昏） */
  sceneKey: string
  /**
   * i18n key：默认昵称，起始三选一/孵化起名弹窗预填这个值（可自定义覆盖，一旦确认就是用户数据，
   * 不再跟着语言切换重新翻译——CJ 2026-08-19 反馈明确要求「改名字是另一回事」）。
   */
  defaultNameKey: string
  rarity: CreatureRarity
  /**
   * 已交付的生命阶段数量。
   */
  maxStage: number
}

export const CREATURES: Record<string, CreatureDef> = {
  mossbear: {
    slug: 'mossbear',
    speciesKey: 'creature.mossbear.species',
    sceneKey: 'creature.mossbear.scene',
    defaultNameKey: 'creature.mossbear.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  spiritfox: {
    slug: 'spiritfox',
    speciesKey: 'creature.spiritfox.species',
    sceneKey: 'creature.spiritfox.scene',
    defaultNameKey: 'creature.spiritfox.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  cloudsheep: {
    slug: 'cloudsheep',
    speciesKey: 'creature.cloudsheep.species',
    sceneKey: 'creature.cloudsheep.scene',
    defaultNameKey: 'creature.cloudsheep.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  mistdeer: {
    slug: 'mistdeer',
    speciesKey: 'creature.mistdeer.species',
    sceneKey: 'creature.mistdeer.scene',
    defaultNameKey: 'creature.mistdeer.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  streamturtle: {
    slug: 'streamturtle',
    speciesKey: 'creature.streamturtle.species',
    sceneKey: 'creature.streamturtle.scene',
    defaultNameKey: 'creature.streamturtle.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  fireflyrabbit: {
    slug: 'fireflyrabbit',
    speciesKey: 'creature.fireflyrabbit.species',
    sceneKey: 'creature.fireflyrabbit.scene',
    defaultNameKey: 'creature.fireflyrabbit.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  dewdropcat: {
    slug: 'dewdropcat',
    speciesKey: 'creature.dewdropcat.species',
    sceneKey: 'creature.dewdropcat.scene',
    defaultNameKey: 'creature.dewdropcat.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  honeysparrow: {
    slug: 'honeysparrow',
    speciesKey: 'creature.honeysparrow.species',
    sceneKey: 'creature.honeysparrow.scene',
    defaultNameKey: 'creature.honeysparrow.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  jellyfrog: {
    slug: 'jellyfrog',
    speciesKey: 'creature.jellyfrog.species',
    sceneKey: 'creature.jellyfrog.scene',
    defaultNameKey: 'creature.jellyfrog.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  cottonraccoon: {
    slug: 'cottonraccoon',
    speciesKey: 'creature.cottonraccoon.species',
    sceneKey: 'creature.cottonraccoon.scene',
    defaultNameKey: 'creature.cottonraccoon.defaultName',
    rarity: 'common',
    maxStage: 4,
  },
  coralwhale: {
    slug: 'coralwhale',
    speciesKey: 'creature.coralwhale.species',
    sceneKey: 'creature.coralwhale.scene',
    defaultNameKey: 'creature.coralwhale.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  amberwolf: {
    slug: 'amberwolf',
    speciesKey: 'creature.amberwolf.species',
    sceneKey: 'creature.amberwolf.scene',
    defaultNameKey: 'creature.amberwolf.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  crystalfoal: {
    slug: 'crystalfoal',
    speciesKey: 'creature.crystalfoal.species',
    sceneKey: 'creature.crystalfoal.scene',
    defaultNameKey: 'creature.crystalfoal.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  emberturtle: {
    slug: 'emberturtle',
    speciesKey: 'creature.emberturtle.species',
    sceneKey: 'creature.emberturtle.scene',
    defaultNameKey: 'creature.emberturtle.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  aurorafox: {
    slug: 'aurorafox',
    speciesKey: 'creature.aurorafox.species',
    sceneKey: 'creature.aurorafox.scene',
    defaultNameKey: 'creature.aurorafox.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  stardustotter: {
    slug: 'stardustotter',
    speciesKey: 'creature.stardustotter.species',
    sceneKey: 'creature.stardustotter.scene',
    defaultNameKey: 'creature.stardustotter.defaultName',
    rarity: 'rare',
    maxStage: 4,
  },
  stardragon: {
    slug: 'stardragon',
    speciesKey: 'creature.stardragon.species',
    sceneKey: 'creature.stardragon.scene',
    defaultNameKey: 'creature.stardragon.defaultName',
    rarity: 'legendary',
    maxStage: 4,
  },
  nightphoenix: {
    slug: 'nightphoenix',
    speciesKey: 'creature.nightphoenix.species',
    sceneKey: 'creature.nightphoenix.scene',
    defaultNameKey: 'creature.nightphoenix.defaultName',
    rarity: 'legendary',
    maxStage: 4,
  },
  rainbowqilin: {
    slug: 'rainbowqilin',
    speciesKey: 'creature.rainbowqilin.species',
    sceneKey: 'creature.rainbowqilin.scene',
    defaultNameKey: 'creature.rainbowqilin.defaultName',
    rarity: 'legendary',
    maxStage: 4,
  },
  sharkmermaid: {
    slug: 'sharkmermaid',
    speciesKey: 'creature.sharkmermaid.species',
    sceneKey: 'creature.sharkmermaid.scene',
    defaultNameKey: 'creature.sharkmermaid.defaultName',
    rarity: 'legendary',
    maxStage: 4,
  },
}

export const DEFAULT_SPECIES = 'mossbear'

/** 首次进入固定三选一；其余生物只从抽蛋池取得。 */
export const STARTER_SPECIES = ['mossbear', 'spiritfox', 'cloudsheep']

/** 已具备走路 A/B、疲倦和沉睡动作帧的生物。 */
export const ACTION_FRAME_SPECIES = new Set(Object.keys(CREATURES))

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

const SPECIES_WITH_EGG_ART = new Set([
  'mossbear',
  'spiritfox',
  'cloudsheep',
  'mistdeer',
  'streamturtle',
  'stardragon',
])

/**
 * 已有专属蛋图的物种显示对应蛋；其余新物种暂用中性星光蛋，等专属蛋图交付后自动扩充名单。
 */
export function eggAsset(species: string): string {
  const assetName = SPECIES_WITH_EGG_ART.has(species) ? species : 'generic'
  return `${import.meta.env.BASE_URL}eggs/${assetName}.webp`
}
