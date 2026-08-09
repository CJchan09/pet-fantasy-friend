import { useState } from 'react'
import { HomeScreen } from '@/screens/HomeScreen'
import { ReflectionScreen } from '@/screens/ReflectionScreen'
import { ReflectionHistoryScreen } from '@/screens/ReflectionHistoryScreen'
import { StarterPickerScreen } from '@/screens/StarterPickerScreen'
import { FocusScreen } from '@/screens/FocusScreen'
import { TasksScreen } from '@/screens/TasksScreen'
import { DexScreen } from '@/screens/DexScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { AnimalChessScreen } from '@/screens/AnimalChessScreen'
import { useGameStore } from '@/store/useGameStore'

type Screen =
  | 'home'
  | 'reflection'
  | 'history'
  | 'focus'
  | 'tasks'
  | 'dex'
  | 'settings'
  | 'animal-chess'

/**
 * 阶段一没有 URL 深链需求，单页 App 用本地视图状态切换即可，不引入 react-router。
 */
function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const hasChosenStarter = useGameStore((s) => s.state.hasChosenStarter)

  if (!hasChosenStarter) {
    return <StarterPickerScreen />
  }

  const goHome = () => setScreen('home')

  if (screen === 'reflection') {
    return <ReflectionScreen onBack={goHome} />
  }
  if (screen === 'history') {
    return <ReflectionHistoryScreen onBack={goHome} />
  }
  if (screen === 'focus') {
    return <FocusScreen onBack={goHome} />
  }
  if (screen === 'tasks') {
    return <TasksScreen onBack={goHome} />
  }
  if (screen === 'dex') {
    return <DexScreen onBack={goHome} />
  }
  if (screen === 'settings') {
    return <SettingsScreen onBack={goHome} />
  }
  if (screen === 'animal-chess') {
    return <AnimalChessScreen onBack={goHome} />
  }
  return (
    <HomeScreen
      onOpenReflection={() => setScreen('reflection')}
      onOpenHistory={() => setScreen('history')}
      onOpenFocus={() => setScreen('focus')}
      onOpenTasks={() => setScreen('tasks')}
      onOpenDex={() => setScreen('dex')}
      onOpenSettings={() => setScreen('settings')}
      onOpenAnimalChess={() => setScreen('animal-chess')}
    />
  )
}

export default App
