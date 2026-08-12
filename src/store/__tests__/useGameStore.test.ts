import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../useGameStore'
import {
  ANIMAL_CHESS_DAILY_WIN_LIMIT,
  ANIMAL_CHESS_WIN_REWARD,
  EGG_ADVANCE_CHUNK,
  EGG_COMMON_COST,
  FEED_STARDUST_COST,
  FOCUS_DAILY_SESSION_LIMIT,
  FOCUS_REWARD_PER_SESSION,
  TASK_FREE_DAILY_ITEM_LIMIT,
  TASK_REWARD_PER_ITEM,
} from '@/config/gameBalance'
import { CREATURES } from '@/config/creatures'

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

describe('useGameStore 成长行为驱动 lastGrowthAt（喂养不算）', () => {
  it('反思首次提交更新 lastGrowthAt，喂养不会', () => {
    expect(useGameStore.getState().state.lastGrowthAt).toBeNull()
    useGameStore.getState().submitReflection({ gratitude: '感恩', learning: '', improvement: '' })
    const afterReflection = useGameStore.getState().state.lastGrowthAt
    expect(afterReflection).not.toBeNull()

    useGameStore.setState((prev) => ({
      state: { ...prev.state, stardust: { balance: FEED_STARDUST_COST }, lastGrowthAt: null },
    }))
    useGameStore.getState().feedPet()
    expect(useGameStore.getState().state.lastGrowthAt).toBeNull()
  })
})

describe('useGameStore 自定义任务', () => {
  it('添加、完成任务发放星尘并驱动成长时间戳', () => {
    useGameStore.getState().addTask('读书')
    const taskId = useGameStore.getState().state.tasks[0].id
    useGameStore.getState().toggleTask(taskId)
    expect(useGameStore.getState().state.stardust.balance).toBe(TASK_REWARD_PER_ITEM)
    expect(useGameStore.getState().state.tasks[0].done).toBe(true)
    expect(useGameStore.getState().state.lastGrowthAt).not.toBeNull()
  })

  it('取消勾选再勾选不重复发放星尘', () => {
    useGameStore.getState().addTask('读书')
    const taskId = useGameStore.getState().state.tasks[0].id
    useGameStore.getState().toggleTask(taskId)
    useGameStore.getState().toggleTask(taskId) // 取消
    expect(useGameStore.getState().state.tasks[0].done).toBe(false)
    useGameStore.getState().toggleTask(taskId) // 再勾选
    expect(useGameStore.getState().state.stardust.balance).toBe(TASK_REWARD_PER_ITEM)
  })

  it('超过当日上限的任务完成不再发星尘', () => {
    for (let i = 0; i < TASK_FREE_DAILY_ITEM_LIMIT + 1; i++) {
      useGameStore.getState().addTask(`任务${i}`)
    }
    const ids = useGameStore.getState().state.tasks.map((t) => t.id)
    ids.forEach((id) => useGameStore.getState().toggleTask(id))
    expect(useGameStore.getState().state.stardust.balance).toBe(
      TASK_FREE_DAILY_ITEM_LIMIT * TASK_REWARD_PER_ITEM,
    )
    expect(useGameStore.getState().state.tasks.every((t) => t.done)).toBe(true)
  })

  it('删除任务', () => {
    useGameStore.getState().addTask('读书')
    const taskId = useGameStore.getState().state.tasks[0].id
    useGameStore.getState().removeTask(taskId)
    expect(useGameStore.getState().state.tasks).toHaveLength(0)
  })
})

describe('useGameStore 专注计时记账', () => {
  it('完成一次专注发放星尘', () => {
    const success = useGameStore.getState().completeFocusSession()
    expect(success).toBe(true)
    expect(useGameStore.getState().state.stardust.balance).toBe(FOCUS_REWARD_PER_SESSION)
    expect(useGameStore.getState().state.focusSessions).toHaveLength(1)
  })

  it('超过当日 4 次上限后不再发放星尘', () => {
    for (let i = 0; i < FOCUS_DAILY_SESSION_LIMIT; i++) {
      useGameStore.getState().completeFocusSession()
    }
    const beforeBalance = useGameStore.getState().state.stardust.balance
    const success = useGameStore.getState().completeFocusSession()
    expect(success).toBe(false)
    expect(useGameStore.getState().state.stardust.balance).toBe(beforeBalance)
  })
})

describe('useGameStore 孵化系统（抽蛋 → 浇灌 → 孵化）', () => {
  it('抽蛋时就定好生物，孵化后蛋位清空、该生物入图鉴', () => {
    useGameStore.setState((prev) => ({
      state: { ...prev.state, stardust: { balance: 1000 } },
    }))
    useGameStore.getState().drawEgg()
    const drawnSpecies = useGameStore.getState().state.egg?.species
    expect(drawnSpecies).toBeTruthy()

    const steps = Math.ceil(EGG_COMMON_COST / EGG_ADVANCE_CHUNK)
    let lastResult: string | null = null
    for (let i = 0; i < steps; i++) {
      lastResult = useGameStore.getState().advanceEgg()
    }
    expect(useGameStore.getState().state.egg).toBeNull()
    expect(lastResult).toBe(drawnSpecies)
    expect(useGameStore.getState().state.ownedCreatures[drawnSpecies!]).toBeTruthy()
  })

  it('孵化完成时昵称先用生物原名占位，renameCreature 能覆盖成自定义名字', () => {
    useGameStore.setState((prev) => ({
      state: { ...prev.state, stardust: { balance: 1000 } },
    }))
    useGameStore.getState().drawEgg()
    const drawnSpecies = useGameStore.getState().state.egg!.species

    const steps = Math.ceil(EGG_COMMON_COST / EGG_ADVANCE_CHUNK)
    for (let i = 0; i < steps; i++) {
      useGameStore.getState().advanceEgg()
    }
    expect(useGameStore.getState().state.ownedCreatures[drawnSpecies].nickname).toBe(
      CREATURES[drawnSpecies].defaultName,
    )

    useGameStore.getState().renameCreature(drawnSpecies, '小甜甜')
    expect(useGameStore.getState().state.ownedCreatures[drawnSpecies].nickname).toBe('小甜甜')
  })

  it('已经有蛋时不能再抽（蛋位只有 1 个）', () => {
    useGameStore.getState().drawEgg()
    const firstSpecies = useGameStore.getState().state.egg?.species
    const drawnAgain = useGameStore.getState().drawEgg()
    expect(drawnAgain).toBe(false)
    expect(useGameStore.getState().state.egg?.species).toBe(firstSpecies)
  })

  it('抽蛋池只有未拥有的生物：只剩一只时必抽到它', () => {
    useGameStore.setState((prev) => ({
      state: {
        ...prev.state,
        ownedCreatures: {
          mossbear: { nickname: 'mossbear' },
          spiritfox: { nickname: 'spiritfox' },
          cloudsheep: { nickname: 'cloudsheep' },
          mistdeer: { nickname: 'mistdeer' },
          streamturtle: { nickname: 'streamturtle' },
          // stardragon 是唯一没拥有的
        },
      },
    }))
    useGameStore.getState().drawEgg()
    expect(useGameStore.getState().state.egg?.species).toBe('stardragon')
  })

  it('全部集齐后抽不出蛋', () => {
    useGameStore.setState((prev) => ({
      state: {
        ...prev.state,
        ownedCreatures: {
          mossbear: { nickname: 'mossbear' },
          spiritfox: { nickname: 'spiritfox' },
          cloudsheep: { nickname: 'cloudsheep' },
          mistdeer: { nickname: 'mistdeer' },
          streamturtle: { nickname: 'streamturtle' },
          stardragon: { nickname: 'stardragon' },
        },
      },
    }))
    expect(useGameStore.getState().drawEgg()).toBe(false)
    expect(useGameStore.getState().state.egg).toBeNull()
  })

  it('星尘不足时浇灌失败', () => {
    useGameStore.setState((prev) => ({ state: { ...prev.state, stardust: { balance: 0 } } }))
    useGameStore.getState().drawEgg()
    const advanced = useGameStore.getState().advanceEgg()
    expect(advanced).toBeNull()
  })
})

describe('useGameStore 清除数据重新开始', () => {
  it('resetGame 后回到初始状态，需要重新选起始宠物', () => {
    useGameStore.getState().chooseStarter('spiritfox', '阿灵')
    useGameStore.getState().submitReflection({ gratitude: '感恩', learning: '', improvement: '' })
    expect(useGameStore.getState().state.stardust.balance).toBeGreaterThan(0)

    useGameStore.getState().resetGame()

    const { state } = useGameStore.getState()
    expect(state.hasChosenStarter).toBe(false)
    expect(state.stardust.balance).toBe(0)
    expect(state.reflections).toEqual([])
    expect(state.ownedCreatures).toEqual({})
    // localStorage 里的存档也被重置，刷新后不会复活旧数据
    const raw = JSON.parse(localStorage.getItem('pet-fantasy-friend:save') as string)
    expect(raw.hasChosenStarter).toBe(false)
    expect(raw.stardust.balance).toBe(0)
  })
})

describe('useGameStore 起始宠物三选一', () => {
  it('选择起始宠物后 hasChosenStarter 为 true 且加入图鉴', () => {
    useGameStore.getState().chooseStarter('spiritfox', '阿灵')
    const { pet, hasChosenStarter, ownedCreatures } = useGameStore.getState().state
    expect(pet.species).toBe('spiritfox')
    expect(pet.name).toBe('阿灵')
    expect(hasChosenStarter).toBe(true)
    expect(ownedCreatures.spiritfox).toEqual({ nickname: '阿灵' })
  })

  it('选择非默认生物时，默认生物不会残留在图鉴里（回归：createDefaultState 曾预置 mossbear 为已拥有）', () => {
    useGameStore.getState().chooseStarter('spiritfox', '阿灵')
    expect(useGameStore.getState().state.ownedCreatures.mossbear).toBeUndefined()
  })
})

describe('useGameStore 斗兽棋结果记账', () => {
  it('人机对战，人赢了发放星尘，且不算成长行为（不唤醒宠物）', () => {
    const rewarded = useGameStore
      .getState()
      .recordAnimalChessResult({ winner: 'red', aiOwner: 'blue' })
    expect(rewarded).toBe(true)
    expect(useGameStore.getState().state.stardust.balance).toBe(ANIMAL_CHESS_WIN_REWARD)
    expect(useGameStore.getState().state.lastGrowthAt).toBeNull()
  })

  it('人机对战，AI 赢了不发星尘也不扣分', () => {
    const rewarded = useGameStore
      .getState()
      .recordAnimalChessResult({ winner: 'blue', aiOwner: 'blue' })
    expect(rewarded).toBe(false)
    expect(useGameStore.getState().state.stardust.balance).toBe(0)
  })

  it('本地双人对战，任何一方赢都发放星尘', () => {
    const rewarded = useGameStore
      .getState()
      .recordAnimalChessResult({ winner: 'blue', aiOwner: null })
    expect(rewarded).toBe(true)
    expect(useGameStore.getState().state.stardust.balance).toBe(ANIMAL_CHESS_WIN_REWARD)
  })

  it('超过每日赢局奖励上限后不再发放', () => {
    for (let i = 0; i < ANIMAL_CHESS_DAILY_WIN_LIMIT; i++) {
      useGameStore.getState().recordAnimalChessResult({ winner: 'red', aiOwner: 'blue' })
    }
    const balanceBefore = useGameStore.getState().state.stardust.balance
    const rewarded = useGameStore
      .getState()
      .recordAnimalChessResult({ winner: 'red', aiOwner: 'blue' })
    expect(rewarded).toBe(false)
    expect(useGameStore.getState().state.stardust.balance).toBe(balanceBefore)
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
