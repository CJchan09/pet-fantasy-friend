import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useGameStore } from '@/store/useGameStore'
import { LanguageToggle } from '@/components/LanguageToggle'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)

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
