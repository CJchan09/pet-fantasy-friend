import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/useAuthStore'

type Mode = 'signIn' | 'signUp'

/**
 * 登录墙：未登录不能进游戏主流程（CJ 2026-08-12 要求）。
 * 邮箱+密码 与 Google 一键登录都支持；注册成功后 Supabase 默认要求邮箱验证，
 * 这里如实转述「去邮箱点确认链接」，不假装注册完就能立刻登入。
 */
export function LoginScreen() {
  const { t } = useTranslation()
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuthStore()

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signedUpHint, setSignedUpHint] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSignedUpHint(false)
    setSubmitting(true)

    const result =
      mode === 'signIn'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password)

    setSubmitting(false)
    if (result) {
      setError(result)
    } else if (mode === 'signUp') {
      setSignedUpHint(true)
    }
  }

  async function handleGoogle() {
    setError(null)
    const result = await signInWithGoogle()
    if (result) {
      setError(result)
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-ink-900">{t('app.title')}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {mode === 'signIn' ? t('login.signInSubtitle') : t('login.signUpSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">{t('login.emailLabel')}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-cream-100 px-3 py-2.5 text-base text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-700">{t('login.passwordLabel')}</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl bg-cream-100 px-3 py-2.5 text-base text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
          />
        </label>

        {error && <p className="text-sm text-[#b3372f]">{error}</p>}
        {signedUpHint && <p className="text-sm text-gold-700">{t('login.signUpSuccessHint')}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-2xl bg-gold-500 py-3.5 text-base font-medium tracking-wide text-[#FFFDF6] shadow-soft transition-colors active:bg-gold-600 disabled:opacity-40"
        >
          {mode === 'signIn' ? t('login.signInButton') : t('login.signUpButton')}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-400">{t('login.orDivider')}</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded-2xl border border-line bg-card py-3 text-sm font-medium text-ink-700 shadow-soft"
      >
        {t('login.googleButton')}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn')
          setError(null)
          setSignedUpHint(false)
        }}
        className="text-center text-sm text-ink-500 underline-offset-2 hover:underline"
      >
        {mode === 'signIn' ? t('login.switchToSignUp') : t('login.switchToSignIn')}
      </button>
    </div>
  )
}
