import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  createDefaultState,
  exportStateAsJson,
  importStateFromJson,
  loadState,
  saveState,
} from '../localStorageAdapter'

beforeEach(() => {
  localStorage.clear()
})

describe('localStorageAdapter', () => {
  it('没有存档时返回默认状态', () => {
    const state = loadState()
    expect(state.schemaVersion).toBe(4)
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
    expect(migrated.schemaVersion).toBe(4)
    expect(migrated.hasChosenStarter).toBe(true)
    expect(migrated.stardust.balance).toBe(55)
    expect(migrated.pet.intimacy).toBe(30)
    expect(migrated.ownedCreatures.mossbear).toBe(true)
    expect(migrated.tasks).toEqual([])
    expect(migrated.animalChessWins).toEqual([])
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
})
