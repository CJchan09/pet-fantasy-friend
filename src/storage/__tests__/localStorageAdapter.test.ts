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
    expect(state.schemaVersion).toBe(1)
    expect(state.stardust.balance).toBe(0)
    expect(state.reflections).toEqual([])
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
