import CloseIcon from "@mui/icons-material/Close"
import Alert from "@mui/material/Alert"
import Badge from "@mui/material/Badge"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import type { SnackbarCloseReason } from "@mui/material/Snackbar"
import Snackbar from "@mui/material/Snackbar"
import SnackbarContent from "@mui/material/SnackbarContent"
import type { CloseReason } from "@mui/material/SpeedDial"
import useSlotProps from "@mui/utils/useSlotProps"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import NotificationsContext from "./NotificationsContext"
import type {
  CloseNotification,
  ShowNotification,
  ShowNotificationOptions,
} from "./useNotifications"

const RootPropsContext = createContext<NotificationsProviderProps | null>(null)

type NotificationProps = {
  notificationKey: string
  badge: string | null
  open: boolean
  message: React.ReactNode
  options: ShowNotificationOptions
}

function Notification({
  notificationKey,
  open,
  message,
  options,
  badge,
}: NotificationProps) {
  const notificationsContext = useContext(NotificationsContext)
  if (!notificationsContext) {
    throw new Error("Notifications context was used without a provider.")
  }
  const { close } = notificationsContext

  const { severity, actionText, onAction, autoHideDuration } = options

  const handleClose = useCallback(
    (_: unknown, reason?: CloseReason | SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return
      }
      close(notificationKey)
    },
    [notificationKey, close],
  )

  const action = (
    <>
      {onAction ? (
        <Button color="inherit" size="small" onClick={onAction}>
          {actionText ?? "Action"}
        </Button>
      ) : null}
      <IconButton
        size="small"
        aria-label="Close"
        title="Close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  )

  const props = useContext(RootPropsContext)
  const snackbarSlotProps = useSlotProps({
    elementType: Snackbar,
    ownerState: props,
    externalSlotProps: {},
    additionalProps: {
      open,
      autoHideDuration,
      onClose: handleClose,
      action,
    },
  })

  return (
    <Snackbar key={notificationKey} {...snackbarSlotProps}>
      <Badge badgeContent={badge} color="primary" sx={{ width: "100%" }}>
        {severity ? (
          <Alert severity={severity} sx={{ width: "100%" }} action={action}>
            {message}
          </Alert>
        ) : (
          <SnackbarContent message={message} action={action} />
        )}
      </Badge>
    </Snackbar>
  )
}

type NotificationQueueEntry = {
  notificationKey: string
  options: ShowNotificationOptions
  open: boolean
  message: React.ReactNode
}

type NotificationsState = {
  queue: NotificationQueueEntry[]
}

type NotificationsProps = {
  state: NotificationsState
}

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
function Notifications({ state }: NotificationsProps) {
  const currentNotification = state.queue[0] ?? null

  // The necessary check is here, but the linter disagrees.
  return (
    currentNotification && (
      <Notification
        {...currentNotification}
        badge={state.queue.length > 1 ? String(state.queue.length) : null}
      />
    )
  )
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition */

export type NotificationsProviderProps = {
  children?: React.ReactNode
}

let nextId = 0
const generateId = () => {
  const id = nextId
  nextId += 1
  return id
}

/**
 * Provider for Notifications. The subtree of this component can use the `useNotifications` hook to
 * access the notifications API. The notifications are shown in the same order they are requested.
 */
export default function NotificationsProvider(
  props: NotificationsProviderProps,
) {
  const { children } = props
  const [state, setState] = useState<NotificationsState>({ queue: [] })

  const show = useCallback<ShowNotification>((message, options = {}) => {
    const notificationKey =
      options.key ?? `::toolpad-internal::notification::${String(generateId())}`
    setState(prev => {
      if (prev.queue.some(n => n.notificationKey === notificationKey)) {
        // deduplicate by key
        return prev
      }
      return {
        ...prev,
        queue: [
          ...prev.queue,
          { message, options, notificationKey, open: true },
        ],
      }
    })
    return notificationKey
  }, [])

  const close = useCallback<CloseNotification>(key => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(n => n.notificationKey !== key),
    }))
  }, [])

  const contextValue = useMemo(() => ({ show, close }), [show, close])

  return (
    <RootPropsContext.Provider value={props}>
      <NotificationsContext.Provider value={contextValue}>
        {children}
        <Notifications state={state} />
      </NotificationsContext.Provider>
    </RootPropsContext.Provider>
  )
}
