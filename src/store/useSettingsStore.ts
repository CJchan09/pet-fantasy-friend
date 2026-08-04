import { useGameStore } from './useGameStore'
import { estimateStateSizeBytes } from '@/storage/localStorageAdapter'

const EXPORT_REMINDER_AFTER_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000
/** localStorage 大致容量上限约 5-10MB，超过 3MB 就开始提醒清理/导出 */
const SIZE_WARNING_BYTES = 3 * 1024 * 1024

/** 按域派生的选择器：存档导出/导入 + 备份提醒 */
export function useSettingsStore() {
  const state = useGameStore((s) => s.state)
  const exportSave = useGameStore((s) => s.exportSave)
  const importSave = useGameStore((s) => s.importSave)

  const daysSinceFirstUse = (Date.now() - new Date(state.firstUsedAt).getTime()) / MS_PER_DAY
  const shouldRemindExport =
    !state.hasExportedSave && daysSinceFirstUse >= EXPORT_REMINDER_AFTER_DAYS
  const sizeBytes = estimateStateSizeBytes(state)

  return {
    exportSave,
    importSave,
    shouldRemindExport,
    sizeBytes,
    shouldWarnSize: sizeBytes >= SIZE_WARNING_BYTES,
  }
}
