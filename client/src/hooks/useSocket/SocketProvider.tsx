import type {
  PermissionRead,
  RoleRead,
  ServicesSnapshot,
  UserOut,
  UserRead,
} from "@/api"
import { useAppDispatch } from "@/app/hooks"
import { setSensors } from "@/features/sensors/sensorsSlice"
import { rolesApiSlice } from "@/features/user/rolesApiSlice"
import { usersApiSlice } from "@/features/user/usersApiSlice"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { io } from "socket.io-client"
import { useAuth } from "../useAuth/useAuth"
import useNotifications from "../useNotifications/useNotifications"
import SocketContext from "./SocketContext"

type SocketProviderProps = {
  children: ReactNode
}

export type ServerNotification = {
  type: "error" | "info" | "success" | "warning"
  code: number
  message: string
}
export type SocketMessage =
  | {
      type: "notification"
      payload: {
        type: "error" | "info" | "success" | "warning"
        code: number
        message: string
      }
    }
  | { type: "user_created" | "user_updated"; payload: { user: UserRead } }
  | { type: "user_deleted"; payload: { user_id: number } }
  | { type: "role_created" | "role_updated"; payload: RoleRead }
  | { type: "role_deleted"; payload: { role_id: number } }
  | {
      type: "role_permission_added" | "role_permission_removed"
      payload: { role: RoleRead; permission: PermissionRead }
    }
  | { type: "sensors"; payload: Record<string, [string]> }
  | { type: "services"; payload: ServicesSnapshot }

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const dispatch = useAppDispatch()
  const WS_PATH = (import.meta.env.VITE_WS_PATH as string | undefined) ?? "/ws"
  const { user, getPermissions, addPerm, removePerm, setCurrentUser } =
    useAuth()
  const permissions = useMemo(() => getPermissions ?? [], [getPermissions])
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState("disconnected")
  const [message, setMessage] = useState<SocketMessage | null>(null)
  const [serverNotification, setServerNotification] =
    useState<ServerNotification>()
  const { show } = useNotifications()

  // Force a clean reconnect so the server re-joins us to the rooms that match
  // our CURRENT role (used when the logged-in user's own role changes).
  const reconnect = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return
    if (socket.connected) socket.disconnect()
    socket.connect()
  }, [])

  // Pull list state from the server. Called on every (re)connect so updates
  // that were emitted while this client was briefly disconnected are recovered
  // — without this, a dropped socket silently misses role/user events.
  const resync = useCallback(() => {
    dispatch(rolesApiSlice.util.invalidateTags(["getRoles"]))
    dispatch(usersApiSlice.util.invalidateTags(["Users"]))
  }, [dispatch])

  const handleSocketMessage = useCallback(
    (message: SocketMessage) => {
      if (!user) return
      switch (message.type) {
        case "role_created":
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              if (
                typeof message.payload === "object" &&
                "id" in message.payload
              ) {
                const newRole = message.payload
                // Guard against duplicates: the actor also receives this event
                // while its own mutation refetch may already have added the row.
                if (!draft.some(role => role.id === newRole.id)) {
                  draft.push(newRole)
                }
              }
            }),
          )
          setMessage(null)
          break
        case "role_deleted":
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              const deletedRoleId = message.payload.role_id
              const deleteIndex = draft.findIndex(
                role => role.id === deletedRoleId,
              )
              if (deleteIndex !== -1) {
                draft.splice(deleteIndex, 1)
              }
            }),
          )
          setMessage(null)
          break
        case "role_updated":
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              if (
                typeof message.payload === "object" &&
                "id" in message.payload
              ) {
                const updatedRole = message.payload
                const index = draft.findIndex(
                  role => role.id === updatedRole.id,
                )
                if (index !== -1) {
                  draft[index] = updatedRole
                }
              }
            }),
          )
          // NOTE: a role rename does not change room membership, so we must NOT
          // reconnect here — doing so churns every watcher's socket.
          setMessage(null)
          break
        case "role_permission_added": {
          const permissionToAdd = message.payload.permission
          dispatch(
            rolesApiSlice.util.updateQueryData(
              "getRolePermissions",
              (message.payload as { role: RoleRead }).role.id,
              draft => {
                if (!draft.some(p => p.id === permissionToAdd.id)) {
                  draft.push(permissionToAdd)
                }
                // add this permission to current user if it belongs to the user's role
              },
            ),
          )
          if (
            user.user.role?.id ===
            (message.payload as { role: RoleRead }).role.id
          ) {
            // dispatch(addPermission(permissionToAdd.name))
            addPerm(permissionToAdd.name)
          }
          setMessage(null)
          break
        }
        case "role_permission_removed": {
          const permissionToRemove = message.payload.permission
          dispatch(
            rolesApiSlice.util.updateQueryData(
              "getRolePermissions",
              (message.payload as { role: RoleRead }).role.id,
              draft => {
                const index = draft.findIndex(
                  p => p.id === permissionToRemove.id,
                )
                if (index !== -1) {
                  draft.splice(index, 1)
                }
                // remove this permission from current user if it exists and belongs to the user's role
              },
            ),
          )
          if (
            user.user.role?.id ===
            (message.payload as { role: RoleRead }).role.id
          ) {
            removePerm(permissionToRemove.name)
          }
          setMessage(null)
          break
        }
        case "user_created":
          dispatch(
            usersApiSlice.util.updateQueryData(
              "getUsers",
              { skip: 0, limit: 100 },
              draft => {
                if (
                  typeof message.payload === "object" &&
                  "user" in message.payload
                ) {
                  const newUser = message.payload.user
                  if (!draft.some(u => u.id === newUser.id)) {
                    draft.push(newUser)
                  }
                }
              },
            ),
          )
          setMessage(null)
          break
        case "user_updated":
          dispatch(
            usersApiSlice.util.updateQueryData(
              "getUsers",
              { skip: 0, limit: 100 },
              draft => {
                if (
                  typeof message.payload === "object" &&
                  "user" in message.payload
                ) {
                  const updatedUser = message.payload.user
                  const index = draft.findIndex(u => u.id === updatedUser.id)
                  if (index !== -1) {
                    draft[index] = updatedUser
                  }
                }
              },
            ),
          )
          // if the updated user is the current user, we may need to update their permissions in the store as well
          if (
            typeof message.payload === "object" &&
            "user" in message.payload &&
            "permissions" in message.payload
          ) {
            const updatedUser = message.payload as UserOut
            if (updatedUser.user.id === user.user.id) {
              setCurrentUser(updatedUser)
              // if the role changed, reconnect so the server re-joins us to the
              // new role's room (otherwise we keep getting the OLD role's events).
              if (updatedUser.user.role?.id !== user.user.role?.id) {
                reconnect()
              }
            }
          }
          setMessage(null)
          break
        case "user_deleted":
          dispatch(
            usersApiSlice.util.updateQueryData(
              "getUsers",
              { skip: 0, limit: 100 },
              draft => {
                const deletedUserId = message.payload.user_id
                const deleteIndex = draft.findIndex(u => u.id === deletedUserId)
                if (deleteIndex !== -1) {
                  draft.splice(deleteIndex, 1)
                }
              },
            ),
          )
          setMessage(null)
          break
        case "sensors":
          dispatch(setSensors(message.payload.sensors))
          setMessage(null)
          break
        case "services":
          setMessage(null)
          break
        default:
          // to be handled by other components that consume the socket context
          setMessage(message)
          console.warn("Unhandled message type:", message)
      }
    },
    [user, dispatch, addPerm, removePerm, setCurrentUser, reconnect],
  )

  // Keep the latest handler / permissions in refs so the socket can bind its
  // listeners ONCE per connection instead of re-binding on every render.
  const handlerRef = useRef(handleSocketMessage)
  useEffect(() => {
    handlerRef.current = handleSocketMessage
  }, [handleSocketMessage])
  const permissionsRef = useRef(permissions)
  useEffect(() => {
    permissionsRef.current = permissions
  }, [permissions])

  const userId = user?.user.id

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setStatus("disconnected")
      }
      return
    }

    const socket = io({
      withCredentials: true,
      autoConnect: true,
      path: WS_PATH,
      transports: ["websocket"],
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setStatus("connected")
      // Recover anything missed while we were (re)connecting.
      resync()
      if (permissionsRef.current.includes("sensors:read")) {
        socket.emit("sensor_list", { list: "all" })
      }
    })
    socket.on("disconnect", () => {
      setStatus("disconnected")
    })
    socket.on("reconnect_attempt", () => {
      setStatus("reconnecting")
    })
    socket.on("msg", (msg: SocketMessage) => {
      setMessage(msg)
      handlerRef.current(msg)
    })
    socket.on("notification", (noti: ServerNotification) => {
      setServerNotification(noti)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("reconnect_attempt")
      socket.off("msg")
      socket.off("notification")
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, WS_PATH, resync])

  useEffect(() => {
    if (serverNotification) {
      show(serverNotification.message, {
        severity: serverNotification.type,
        autoHideDuration: serverNotification.type === "error" ? 10000 : 3000,
      })
    }
  }, [serverNotification, show])

  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      status,
      message,
      setMessage,
      reconnect,
    }),
    [status, message, reconnect],
  )

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
