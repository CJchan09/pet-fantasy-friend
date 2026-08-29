import { useGameStore } from './useGameStore'

/** 按域派生的选择器：通知偏好 */
export function useNotificationStore() {
  const notifications = useGameStore((s) => s.state.notifications)
  const setNotificationSettings = useGameStore((s) => s.setNotificationSettings)
  return { notifications, setNotificationSettings }
}
