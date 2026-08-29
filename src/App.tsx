import { useEffect, useState } from 'react'
import { TodayScreen } from '@/screens/TodayScreen'
import { CompanionScreen } from '@/screens/CompanionScreen'
import { InsightsScreen } from '@/screens/InsightsScreen'
import { ReflectionScreen } from '@/screens/ReflectionScreen'
import { ReflectionHistoryScreen } from '@/screens/ReflectionHistoryScreen'
import { StarterPickerScreen } from '@/screens/StarterPickerScreen'
import { FocusScreen } from '@/screens/FocusScreen'
import { TasksScreen } from '@/screens/TasksScreen'
import { HabitsScreen } from '@/screens/HabitsScreen'
import { DexScreen } from '@/screens/DexScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { AnimalChessScreen } from '@/screens/AnimalChessScreen'
import { LoginScreen } from '@/screens/LoginScreen'
import { LanguagePickerScreen } from '@/screens/LanguagePickerScreen'
import { TabBar, type TabKey } from '@/components/layout/TabBar'
import { useGameStore } from '@/store/useGameStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useLanguageGateStore } from '@/store/useLanguageGateStore'
import { useFocusTimerStore } from '@/store/useFocusTimerStore'
import { initCloudSync } from '@/lib/cloudSync'
import { startReminderScheduler } from '@/lib/notifications'
import type { FocusLink } from '@/types'

/** Tab 之外的二级页面；null 表示当前就停在 Tab 上 */
type Overlay = 'reflection' | 'history' | 'tasks' | 'habits' | 'dex' | 'settings' | 'animal-chess'

/**
 * 阶段一没有 URL 深链需求，单页 App 用本地视图状态切换即可，不引入 react-router。
 * 结构：四个常驻 Tab（Today / Focus / Companion / Insights）+ 覆盖在上面的二级页面。
 * 二级页面显示时隐藏 TabBar，避免手机上底部两层导航打架。
 */
function App() {
  const [tab, setTab] = useState<TabKey>('today')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const hasChosenStarter = useGameStore((s) => s.state.hasChosenStarter)
  const { user, authReady, profileReady } = useAuthStore()
  const hasChosenLanguage = useLanguageGateStore((s) => s.hasChosenLanguage)
  const { setMinutes, setLink } = useFocusTimerStore()

  useEffect(() => {
    initCloudSync()
  }, [])

  // 前台提醒调度：登录并选好起始宠物之后才启动，避免在登录页就开始弹通知
  useEffect(() => {
    if (!user || !hasChosenStarter) {
      return
    }
    return startReminderScheduler(() => useGameStore.getState().state)
  }, [user, hasChosenStarter])

  if (!hasChosenLanguage) {
    return <LanguagePickerScreen />
  }

  if (!authReady) {
    return null // 第一次 session 检查很快，不值得为这一瞬间加个专门的加载态
  }

  if (!user) {
    return <LoginScreen />
  }

  if (!profileReady) {
    return null // 登录成功到云端存档拉取合并完成之间，避免闪一下本机的旧数据
  }

  if (!hasChosenStarter) {
    return <StarterPickerScreen />
  }

  const closeOverlay = () => setOverlay(null)

  /** 从 Today / Todo 跳去专注：带上时长与可选关联，落到 Focus Tab */
  const startFocus = (minutes: number, link: FocusLink | null) => {
    setMinutes(minutes)
    setLink(link)
    setOverlay(null)
    setTab('focus')
  }

  if (overlay) {
    return (
      <div className="flex min-h-full flex-col">
        {overlay === 'reflection' && <ReflectionScreen onBack={closeOverlay} />}
        {overlay === 'history' && <ReflectionHistoryScreen onBack={closeOverlay} />}
        {overlay === 'tasks' && (
          <TasksScreen onBack={closeOverlay} onStartFocus={startFocus} />
        )}
        {overlay === 'habits' && <HabitsScreen onBack={closeOverlay} />}
        {overlay === 'dex' && <DexScreen onBack={closeOverlay} />}
        {overlay === 'settings' && <SettingsScreen onBack={closeOverlay} />}
        {overlay === 'animal-chess' && <AnimalChessScreen onBack={closeOverlay} />}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="min-h-0 flex-1">
        {tab === 'today' && (
          <TodayScreen
            onOpenSettings={() => setOverlay('settings')}
            onOpenTasks={() => setOverlay('tasks')}
            onOpenHabits={() => setOverlay('habits')}
            onStartFocus={startFocus}
          />
        )}
        {tab === 'focus' && <FocusScreen onBack={() => setTab('today')} />}
        {tab === 'companion' && (
          <CompanionScreen
            onOpenDex={() => setOverlay('dex')}
            onOpenAnimalChess={() => setOverlay('animal-chess')}
          />
        )}
        {tab === 'insights' && (
          <InsightsScreen
            onOpenReflection={() => setOverlay('reflection')}
            onOpenHistory={() => setOverlay('history')}
            onOpenSettings={() => setOverlay('settings')}
          />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default App
