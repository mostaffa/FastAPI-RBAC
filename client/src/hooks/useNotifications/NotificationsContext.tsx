import { createContext } from "react"
import type { CloseNotification, ShowNotification } from "./useNotifications"

const NotificationsContext = createContext<{
  show: ShowNotification
  close: CloseNotification
} | null>(null)

export default NotificationsContext
