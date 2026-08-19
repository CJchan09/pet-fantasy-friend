import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export type UserRole = 'user' | 'admin'

interface AuthStore {
  session: Session | null
  user: User | null
  role: UserRole
  /** 第一次 session 检查是否已完成——没检查完之前不能直接判定「未登录」，否则会闪一下登录页 */
  authReady: boolean
  /** 云端存档是否已经拉取合并完成（登录成功到这一步之前，游戏画面不能显示，否则可能显示到旧的本机数据） */
  profileReady: boolean
  signUpWithPassword: (email: string, password: string) => Promise<string | null>
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

/** 只做「翻译成用户看得懂的话」，不做别的判断——Supabase 报什么错就转述什么，不额外加解读 */
function describeAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return '邮箱或密码不对'
  }
  if (message.includes('User already registered')) {
    return '这个邮箱已经注册过了，直接登录就好'
  }
  return message
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  role: 'user',
  authReady: false,
  profileReady: false,

  signUpWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? describeAuthError(error.message) : null
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? describeAuthError(error.message) : null
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    })
    return error ? describeAuthError(error.message) : null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ role: 'user', profileReady: false })
  },
}))
