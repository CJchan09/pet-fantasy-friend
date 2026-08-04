import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../useGameStore'
import { FEED_STARDUST_COST } from '@/config/gameBalance'

beforeEach(() => {
  localStorage.clear()
  useGameStore.getState().resetForTests()
})

describe('useGameStore 反思提交', () => {
  it('提交三问全填给 40 星尘', () => {
    useGameStore.getState().submitReflection({
      gratitude: '感恩今天',
      learning: '学到东西',
      improvement: '明天改进',
    })
    expect(useGameStore.getState().state.stardust.balance).toBe(40)
    expect(useGameStore.getState().hasSubmittedToday()).toBe(true)
  })

  it('同日重复提交不重复发放星尘，但内容会更新', () => {
    const store = useGameStore.getState()
    store.submitReflection({
      gratitude: '第一次',
      learning: '',
      improvement: '',
    })
    expect(useGameStore.getState().state.stardust.balance).toBe(12)

    useGameStore.getState().submitReflection({
      gratitude: '第一次-已编辑',
      learning: '补充学习',
      improvement: '补充改进',
    })
    // 同一天再次提交：星尘不因为编辑而重新按新内容计算发放
    expect(useGameStore.getState().state.stardust.balance).toBe(12)
    expect(useGameStore.getState().state.reflections).toHaveLength(1)
    expect(useGameStore.getState().state.reflections[0].answers.gratitude).toBe(
      '第一次-已编辑',
    )
  })

  it('刷新（重新读取 localStorage）后数据不丢', () => {
    useGameStore.getState().submitReflection({
      gratitude: '感恩',
      learning: '学习',
      improvement: '改进',
    })
    const raw = localStorage.getItem('pet-fantasy-friend:save')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.stardust.balance).toBe(40)
  })
})

describe('useGameStore 喂养', () => {
  it('星尘足够时喂养扣费并提升亲密度', () => {
    useGameStore.setState((prev) => ({
      state: { ...prev.state, stardust: { balance: FEED_STARDUST_COST } },
    }))
    const success = useGameStore.getState().feedPet()
    expect(success).toBe(true)
    expect(useGameStore.getState().state.stardust.balance).toBe(0)
    expect(useGameStore.getState().state.pet.intimacy).toBeGreaterThan(0)
  })

  it('星尘不足时喂养失败，不扣任何东西', () => {
    useGameStore.setState((prev) => ({
      state: { ...prev.state, stardust: { balance: 0 } },
    }))
    const success = useGameStore.getState().feedPet()
    expect(success).toBe(false)
    expect(useGameStore.getState().state.stardust.balance).toBe(0)
  })
})

describe('useGameStore 导出/导入', () => {
  it('导出再导入可以还原状态', () => {
    useGameStore.getState().submitReflection({
      gratitude: '感恩',
      learning: '学习',
      improvement: '改进',
    })
    const json = useGameStore.getState().exportSave()

    useGameStore.getState().resetForTests()
    expect(useGameStore.getState().state.stardust.balance).toBe(0)

    const ok = useGameStore.getState().importSave(json)
    expect(ok).toBe(true)
    expect(useGameStore.getState().state.stardust.balance).toBe(40)
  })
})
