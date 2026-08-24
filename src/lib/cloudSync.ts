import { supabase } from './supabaseClient'
import { useGameStore } from '@/store/useGameStore'
import { useAuthStore, type UserRole } from '@/store/useAuthStore'
import { resolveLoginMerge } from '@/domain/cloudSync'
import { parsePersistedState, saveState } from '@/storage/localStorageAdapter'
import type { AppState } from '@/types'

const PUSH_DEBOUNCE_MS = 800

let initialized = false
let pushTimer: number | undefined
let unsubscribeGameStore: (() => void) | undefined

async function pullAndMerge(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, game_state')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[cloudSync] 拉取云端存档失败', error)
    useAuthStore.setState({ profileReady: true })
    return
  }

  // 正常情况下 supabase/schema.sql 里的 handle_new_user 触发器会在注册时自动建好这一行；
  // 万一触发器没接上（比如账号是在这条触发器建好之前注册的），这里兜底建一行，
  // 不然后面的 pushToCloud 用 update 会一直静默匹配不到任何行，云端同步就永久卡死。
  if (!data) {
    const { error: insertError } = await supabase.from('profiles').insert({ id: userId })
    if (insertError) {
      console.error('[cloudSync] 兜底创建 profiles 行失败', insertError)
    }
  }

  const hasCloudState =
    data?.game_state &&
    typeof data.game_state === 'object' &&
    !Array.isArray(data.game_state) &&
    Object.keys(data.game_state).length > 0
  const cloudState = hasCloudState ? parsePersistedState(data.game_state) : null
  if (hasCloudState && !cloudState) {
    console.error('[cloudSync] 云端存档格式无效或超出大小限制，已忽略')
  }
  const localState = useGameStore.getState().state
  const { resolved, source } = resolveLoginMerge(localState, cloudState)

  saveState(resolved)
  useGameStore.setState({ state: resolved })
  useAuthStore.setState({
    role: ((data?.role as UserRole) ?? 'user'),
    profileReady: true,
  })

  // 本机存档刚被采用为账号的初始数据时，立刻推一次云端，不用等下一次改动触发防抖
  if (source === 'local') {
    await pushToCloud(userId, resolved)
  }
}

async function pushToCloud(userId: string, state: AppState) {
  const { error } = await supabase
    .from('profiles')
    .update({ game_state: state, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) {
    console.error('[cloudSync] 推送云端存档失败', error)
  }
}

function startWatchingLocalChanges(userId: string) {
  unsubscribeGameStore?.()
  unsubscribeGameStore = useGameStore.subscribe((s) => {
    window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => pushToCloud(userId, s.state), PUSH_DEBOUNCE_MS)
  })
}

function stopWatchingLocalChanges() {
  unsubscribeGameStore?.()
  unsubscribeGameStore = undefined
  window.clearTimeout(pushTimer)
}

/**
 * 登录/登出的编排逻辑：session 变化 → 决定用哪份存档、开始/停止监听本机改动同步云端。
 * 只在 App 挂载时调用一次（见 App.tsx），不是 React hook——纯粹是浏览器端的副作用编排，
 * 拆出来是为了不把这堆 Supabase 调用逻辑塞进 UI 组件或 useGameStore 本体。
 */
export function initCloudSync() {
  if (initialized) {
    return
  }
  initialized = true

  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({ session, user: session?.user ?? null, authReady: true })

    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
      pullAndMerge(session.user.id)
      startWatchingLocalChanges(session.user.id)
    } else if (event === 'SIGNED_OUT') {
      stopWatchingLocalChanges()
      useAuthStore.setState({ role: 'user', profileReady: false })
    }
  })
}
