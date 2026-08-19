import { describe, expect, it } from 'vitest'
import { resolveLoginMerge } from '../cloudSync'
import { createDefaultState } from '@/storage/localStorageAdapter'

describe('resolveLoginMerge 登录时的存档合并规则', () => {
  it('账号云端还没有存档（cloudState 为 null）时，采用本机存档', () => {
    const local = { ...createDefaultState(), hasChosenStarter: true, stardust: { balance: 40 } }
    const { resolved, source } = resolveLoginMerge(local, null)
    expect(source).toBe('local')
    expect(resolved).toBe(local)
  })

  it('账号云端存的是还没选起始宠物的空白存档时，也当作「没存档」，采用本机的', () => {
    const local = { ...createDefaultState(), hasChosenStarter: true, stardust: { balance: 40 } }
    const cloud = createDefaultState() // hasChosenStarter: false
    const { resolved, source } = resolveLoginMerge(local, cloud)
    expect(source).toBe('local')
    expect(resolved).toBe(local)
  })

  it('账号云端已经有进度时，保留云端，本机数据不覆盖', () => {
    const local = { ...createDefaultState(), hasChosenStarter: true, stardust: { balance: 5 } }
    const cloud = { ...createDefaultState(), hasChosenStarter: true, stardust: { balance: 999 } }
    const { resolved, source } = resolveLoginMerge(local, cloud)
    expect(source).toBe('cloud')
    expect(resolved).toBe(cloud)
    expect(resolved.stardust.balance).toBe(999)
  })
})
