import { useState } from 'react'
import { HomeScreen } from '@/screens/HomeScreen'
import { ReflectionScreen } from '@/screens/ReflectionScreen'
import { ReflectionHistoryScreen } from '@/screens/ReflectionHistoryScreen'

type Screen = 'home' | 'reflection' | 'history'

/**
 * 阶段一没有 URL 深链需求，单页 App 用本地视图状态切换即可，不引入 react-router。
 */
function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'reflection') {
    return <ReflectionScreen onBack={() => setScreen('home')} />
  }
  if (screen === 'history') {
    return <ReflectionHistoryScreen onBack={() => setScreen('home')} />
  }
  return (
    <HomeScreen
      onOpenReflection={() => setScreen('reflection')}
      onOpenHistory={() => setScreen('history')}
    />
  )
}

export default App
