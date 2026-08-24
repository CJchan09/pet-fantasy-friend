import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  MAX_SAVE_SIZE_BYTES,
  createDefaultState,
  exportStateAsJson,
  importStateFromJson,
  loadState,
  saveState,
} from '../localStorageAdapter'
import { CREATURES } from '@/config/creatures'
import i18n from '@/i18n'

beforeEach(() => {
  localStorage.clear()
})

describe('localStorageAdapter', () => {
  it('没有存档时返回默认状态', () => {
    const state = loadState()
    expect(state.schemaVersion).toBe(5)
    expect(state.stardust.balance).toBe(0)
    expect(state.reflections).toEqual([])
    expect(state.hasChosenStarter).toBe(false)
    expect(state.tasks).toEqual([])
    expect(state.egg).toBeNull()
    expect(state.animalChessWins).toEqual([])
    // 起始三选一之前不预先拥有任何生物，避免选别的生物后默认生物仍残留在图鉴里
    expect(state.ownedCreatures).toEqual({})
  })

  it('v1 旧存档（没有 hasChosenStarter 字段）迁移时视为已完成起始选择，不会被打回三选一页面', () => {
    const legacyV1 = {
      schemaVersion: 1,
      pet: { name: '苔苔', species: 'mossbear', intimacy: 30, level: 2 },
      stardust: { balance: 55 },
      reflections: [],
      draftReflection: null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyV1))
    const migrated = loadState()
    expect(migrated.schemaVersion).toBe(5)
    expect(migrated.hasChosenStarter).toBe(true)
    expect(migrated.stardust.balance).toBe(55)
    expect(migrated.pet.intimacy).toBe(30)
    expect(migrated.ownedCreatures.mossbear).toEqual({ nickname: '苔苔' })
    expect(migrated.tasks).toEqual([])
    expect(migrated.animalChessWins).toEqual([])
  })

  it('读取旧版 5 级上限存档时，会按亲密度自动修复等级', () => {
    const legacy = {
      ...createDefaultState(),
      pet: { name: '苔苔', species: 'mossbear', intimacy: 275, level: 5 },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))

    const migrated = loadState()

    expect(migrated.pet.level).toBe(6)
    expect(migrated.pet.intimacy).toBe(275)
  })

  it('v3 旧格式的蛋（{rarity, progress}）迁移为「就地抽定生物」并保留进度', () => {
    const legacyV3 = {
      schemaVersion: 3,
      pet: { name: '苔苔', species: 'mossbear', intimacy: 10, level: 1 },
      stardust: { balance: 100 },
      reflections: [],
      draftReflection: null,
      hasChosenStarter: true,
      ownedCreatures: { mossbear: true },
      egg: { rarity: 'common', progress: 40 },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyV3))
    const migrated = loadState()
    expect(migrated.egg).not.toBeNull()
    expect(typeof migrated.egg?.species).toBe('string')
    expect(migrated.egg?.species).not.toBe('mossbear') // 只会抽到未拥有的
    expect(migrated.egg?.progress).toBe(40) // 已投入的星尘不丢
  })

  it('v4 旧格式的 ownedCreatures（Record<string, boolean>）迁移为带昵称的记录', () => {
    const legacyV4 = {
      schemaVersion: 4,
      pet: { name: '阿灵', species: 'spiritfox', intimacy: 10, level: 1 },
      stardust: { balance: 0 },
      reflections: [],
      draftReflection: null,
      hasChosenStarter: true,
      ownedCreatures: { spiritfox: true, mossbear: true },
      egg: null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyV4))
    const migrated = loadState()
    expect(migrated.schemaVersion).toBe(5)
    // 当前陪伴的生物用 pet.name 当默认昵称，其余用生物原名，不会全部变回「？？？」
    expect(migrated.ownedCreatures.spiritfox).toEqual({ nickname: '阿灵' })
    expect(migrated.ownedCreatures.mossbear).toEqual({
      nickname: i18n.t(CREATURES.mossbear.defaultNameKey),
    })
  })

  it('回归（2026-08-19 CJ 反馈）：还没选起始宠物时，迁移不会把默认占位生物误标成已拥有', () => {
    // 起始三选一还没选完时，schemaVersion 已经是最新但 hasChosenStarter 明确是 false、
    // ownedCreatures 是空的——pet.species 这时候只是占位的默认值（苔熊），不代表真的拥有它
    const midOnboarding = {
      schemaVersion: 5,
      pet: { name: '苔苔', species: 'mossbear', intimacy: 0, level: 1 },
      stardust: { balance: 0 },
      reflections: [],
      draftReflection: null,
      hasChosenStarter: false,
      ownedCreatures: {},
      egg: null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(midOnboarding))
    const migrated = loadState()
    expect(migrated.ownedCreatures).toEqual({})
  })

  it('全新存档（真的没玩过）hasChosenStarter 为 false', () => {
    expect(loadState().hasChosenStarter).toBe(false)
  })

  it('保存后可以正确读回', () => {
    const state = createDefaultState()
    state.stardust.balance = 40
    saveState(state)
    const loaded = loadState()
    expect(loaded.stardust.balance).toBe(40)
  })

  it('localStorage 内容损坏时回退默认状态，不抛出异常', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(() => loadState()).not.toThrow()
    expect(loadState().stardust.balance).toBe(0)
  })

  it('导出为 JSON 再导入可以还原', () => {
    const state = createDefaultState()
    state.stardust.balance = 88
    state.pet.intimacy = 20
    const json = exportStateAsJson(state)
    const imported = importStateFromJson(json)
    expect(imported).not.toBeNull()
    expect(imported?.stardust.balance).toBe(88)
    expect(imported?.pet.intimacy).toBe(20)
  })

  it('导入格式不对的 JSON 时返回 null', () => {
    expect(importStateFromJson('{"foo": "bar"}')).toBeNull()
    expect(importStateFromJson('not json at all')).toBeNull()
  })

  it('拒绝类型伪造、未知生物和未来版本的存档', () => {
    const valid = createDefaultState()
    expect(importStateFromJson(JSON.stringify({ ...valid, hasChosenStarter: 'yes' }))).toBeNull()
    expect(
      importStateFromJson(
        JSON.stringify({ ...valid, pet: { ...valid.pet, species: 'not-a-creature' } }),
      ),
    ).toBeNull()
    expect(
      importStateFromJson(JSON.stringify({ ...valid, schemaVersion: valid.schemaVersion + 1 })),
    ).toBeNull()
  })

  it('拒绝超过存档大小上限的数据', () => {
    const valid = createDefaultState()
    const oversized = JSON.stringify({
      ...valid,
      pet: { ...valid.pet, name: 'x'.repeat(MAX_SAVE_SIZE_BYTES) },
    })
    expect(importStateFromJson(oversized)).toBeNull()
  })
})
