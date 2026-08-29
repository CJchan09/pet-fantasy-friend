import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useGameStore } from '@/store/useGameStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { LanguageToggle } from '@/components/LanguageToggle'
import {
  notificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications'

interface SettingsScreenProps {
  onBack: () => void
}

function downloadJson(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pet-fantasy-friend-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 存档导出/导入 UI（PRD 3.3.7）：全部数据只存本地，导出是唯一的备份保险 */
export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t } = useTranslation()
  const { exportSave, importSave, shouldRemindExport, sizeBytes, shouldWarnSize } =
    useSettingsStore()
  const resetGame = useGameStore((s) => s.resetGame)
  const adminAddStardust = useGameStore((s) => s.adminAddStardust)
  const { user, role, signOut } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [adminAmount, setAdminAmount] = useState('100')
  const { notifications, setNotificationSettings } = useNotificationStore()
  const aiConsent = useGameStore((s) => s.state.aiConsent)
  const setAiConsent = useGameStore((s) => s.setAiConsent)
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported')

  useEffect(() => {
    setPermission(notificationPermission())
  }, [])

  /**
   * 只在用户主动打开总开关时才向浏览器要权限。
   * 被拒绝过（permission==='denied'）就不再问第二次——方案文档 §5.2「不反复弹窗」。
   */
  async function handleToggleGlobalNotifications(next: boolean) {
    setNotificationSettings({ globalEnabled: next })
    if (next) {
      setPermission(await requestNotificationPermission())
    }
  }

  function handleAdminAddStardust() {
    const amount = Number(adminAmount)
    adminAddStardust(amount)
  }

  function handleResetConfirmed() {
    setConfirmingReset(false)
    resetGame()
    // 清空后 hasChosenStarter=false，App 会直接切到三选一页面；
    // 先把导航拨回主界面，选完新伙伴就落在主界面而不是设置页
    onBack()
  }

  function handleExport() {
    downloadJson(exportSave())
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importSave(String(reader.result))
      setImportResult(ok ? 'success' : 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-6 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('settings.backButton')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-lg text-ink-600 shadow-soft"
        >
          ←
        </button>
        <h1 className="text-[15px] font-medium text-ink-900">{t('settings.title')}</h1>
      </header>

      <section className="mb-3 flex items-center justify-between rounded-[20px] bg-card p-4 shadow-soft">
        <div>
          <p className="text-sm font-medium text-ink-800">{user?.email ?? ''}</p>
          {role === 'admin' && (
            <p className="mt-0.5 text-xs text-gold-700">{t('settings.adminBadge')}</p>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-700"
        >
          {t('settings.signOutButton')}
        </button>
      </section>

      {role === 'admin' && (
        <section className="mb-3 flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-soft">
          <div>
            <p className="text-sm font-medium text-ink-800">{t('settings.adminPanelTitle')}</p>
            <p className="mt-1 text-xs text-ink-400">{t('settings.adminPanelHint')}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={adminAmount}
              onChange={(e) => setAdminAmount(e.target.value)}
              className="w-24 rounded-xl bg-cream-100 px-3 py-2.5 text-base text-ink-900 outline-none focus:ring-1 focus:ring-gold-500/40"
            />
            <button
              type="button"
              onClick={handleAdminAddStardust}
              className="flex-1 rounded-xl bg-gold-500 py-2.5 text-sm font-medium text-[#FFFDF6]"
            >
              {t('settings.adminAddStardustButton')}
            </button>
          </div>
        </section>
      )}

      {shouldRemindExport && (
        <div className="mb-3 rounded-2xl bg-chip px-4 py-3 text-xs text-ink-600">
          {t('settings.exportReminder')}
        </div>
      )}
      {shouldWarnSize && (
        <div className="mb-3 rounded-2xl bg-chip px-4 py-3 text-xs text-ink-600">
          {t('settings.sizeWarning', { size: Math.round(sizeBytes / 1024) })}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-soft">
        <div>
          <p className="text-sm font-medium text-ink-800">{t('settings.backupTitle')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('settings.backupHint')}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-xl bg-gold-500 py-2.5 text-sm font-medium text-[#FFFDF6]"
        >
          {t('settings.exportButton')}
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-xl border border-line py-2.5 text-sm font-medium text-ink-700"
        >
          {t('settings.importButton')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        {importResult === 'success' && (
          <p className="text-xs text-gold-700">{t('settings.importSuccess')}</p>
        )}
        {importResult === 'error' && (
          <p className="text-xs text-ink-500">{t('settings.importError')}</p>
        )}
      </section>

      {/* 提醒设置（方案文档 §5.2）：总开关 + 分类开关，权限被拒时说明清楚，不再骚扰 */}
      <section className="mt-3 flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-soft">
        <div>
          <p className="text-sm font-medium text-ink-800">{t('settings.notificationsTitle')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('settings.notificationsHint')}</p>
        </div>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-700">{t('settings.notificationsGlobal')}</span>
          <input
            type="checkbox"
            checked={notifications.globalEnabled}
            onChange={(e) => void handleToggleGlobalNotifications(e.target.checked)}
            className="h-5 w-5 accent-gold-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-700">{t('settings.notificationsHabits')}</span>
          <input
            type="checkbox"
            disabled={!notifications.globalEnabled}
            checked={notifications.habitRemindersEnabled}
            onChange={(e) => setNotificationSettings({ habitRemindersEnabled: e.target.checked })}
            className="h-5 w-5 accent-gold-500 disabled:opacity-40"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-700">{t('settings.notificationsTodos')}</span>
          <input
            type="checkbox"
            disabled={!notifications.globalEnabled}
            checked={notifications.todoRemindersEnabled}
            onChange={(e) => setNotificationSettings({ todoRemindersEnabled: e.target.checked })}
            className="h-5 w-5 accent-gold-500 disabled:opacity-40"
          />
        </label>

        {permission === 'denied' && (
          <p className="text-xs text-ink-500">{t('settings.notificationsDenied')}</p>
        )}
        {permission === 'unsupported' && (
          <p className="text-xs text-ink-500">{t('settings.notificationsUnsupported')}</p>
        )}
        <p className="text-[11px] text-ink-400">{t('settings.notificationsWebLimitation')}</p>
      </section>

      {/* AI 数据授权（方案文档 §9.2）：反思正文默认不发送，必须用户主动打开 */}
      <section className="mt-3 flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-soft">
        <div>
          <p className="text-sm font-medium text-ink-800">{t('settings.aiTitle')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('settings.aiDefaultHint')}</p>
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-700">{t('settings.aiAllowReflection')}</span>
          <input
            type="checkbox"
            checked={aiConsent.allowReflectionText}
            onChange={(e) => setAiConsent({ allowReflectionText: e.target.checked })}
            className="h-5 w-5 accent-gold-500"
          />
        </label>
        <p className="text-[11px] text-ink-400">{t('settings.aiReflectionHint')}</p>
      </section>

      <section className="mt-3 flex items-center justify-between rounded-[20px] bg-card p-4 shadow-soft">
        <p className="text-sm font-medium text-ink-800">{t('settings.languageLabel')}</p>
        <LanguageToggle />
      </section>

      {/* 危险区：清除数据重新开始，必须两步确认 */}
      <section className="mt-3 flex flex-col gap-3 rounded-[20px] bg-card p-4 shadow-soft">
        <div>
          <p className="text-sm font-medium text-ink-800">{t('settings.dangerTitle')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('settings.dangerHint')}</p>
        </div>
        {!confirmingReset ? (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="rounded-xl border border-[#d2352f]/40 py-2.5 text-sm font-medium text-[#b3372f]"
          >
            {t('settings.resetButton')}
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl bg-cream-100 p-3">
            <p className="text-xs leading-relaxed text-ink-700">
              {t('settings.resetConfirmHint')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="flex-1 rounded-xl border border-line py-2 text-sm font-medium text-ink-700"
              >
                {t('settings.resetCancelButton')}
              </button>
              <button
                type="button"
                onClick={handleResetConfirmed}
                className="flex-1 rounded-xl bg-[#b3372f] py-2 text-sm font-medium text-white"
              >
                {t('settings.resetConfirmButton')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
