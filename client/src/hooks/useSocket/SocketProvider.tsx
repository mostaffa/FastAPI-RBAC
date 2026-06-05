import React, { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useAppDispatch } from "../../app/hooks"
import { setSensors } from "../../features/sensors/sensorsSlice"
import SocketContext from "./SocketContext"
import type { ReactNode } from "react"
import type { Socket } from "socket.io-client"
import type {
  UserRead,
  RoleRead,
  PermissionRead,
  UserOut,
  ServicesSnapshot,
} from "../../api"
import { rolesApiSlice } from "../../features/user/rolesApiSlice"
import { usersApiSlice } from "../../features/user/usersApiSlice"
import useNotifications from "../useNotifications/useNotifications"
import { useAuth } from "../useAuth/useAuth"

type SocketProviderProps = {
  children: ReactNode
}

// export type SocketMessage = {
//   type:
//     | "notification"
//     | "error"
//     | "user_created"
//     | "user_updated"
//     | "user_deleted"
//     | "role_created"
//     | "role_updated"
//     | "role_deleted"
//     | "role_permission_added"
//     | "role_permission_removed"
//     | "sensors"
//   payload:
//     | UserRead
//     | RoleRead
//     | PermissionRead
//     | string
//     | number
//     | { role_id: number }
//     | { user_id: number }
//     | { role: RoleRead; permission: PermissionRead }
//     | { message: string }
//     | Record<string, string>
// }
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
  const permissions = React.useMemo(
    () => getPermissions ?? [],
    [getPermissions],
  )
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState("disconnected")
  const [message, setMessage] = useState<SocketMessage | null>(null)
  const [serverNotification, setServerNotification] =
    useState<ServerNotification>()
  const { show } = useNotifications()

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        if (socketRef.current.connected) {
          socketRef.current.disconnect()
        }
      }
      socketRef.current = null
      return
    }
    socketRef.current ??= io({
      withCredentials: true,
      autoConnect: true,
      path: WS_PATH,
      transports: ["websocket"],
    })
    const socket = socketRef.current
    socket.on("connect", () => {
      setStatus("connected")
    })
    socket.on("disconnect", () => {
      setStatus("disconnected")
      // console.log(`\u001b[31mSocket disconnected\u001b[0m`)
    })
    socket.on("reconnect_attempt", () => {
      setStatus("reconnecting")
      // console.log(`\u001b[33mSocket reconnect_attempt\u001b[0m`);
    })
    socket.on("msg", (message: SocketMessage) => {
      setMessage(message)
      console.log(
        `\u001b[36mMessage received: ${JSON.stringify(message)}\u001b[0m`,
      )
    })

    socket.on("notification", (noti: ServerNotification) => {
      setServerNotification(noti)
    })

    if (permissions.includes("sensors:read")) {
      socket.emit("sensor_list", { list: "all" })
    }

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("reconnect_attempt")
      socket.off("msg")
      socket.off("notification")
    }
  }, [user, WS_PATH, permissions])

  const reconnect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      // disconnect first
      socketRef.current.disconnect()
      // then reconnect
      socketRef.current.connect()
    }
  }

  useEffect(() => {
    if (user && socketRef.current) {
      if (message) {
        switch (message.type) {
          case "role_created":
            dispatch(
              rolesApiSlice.util.updateQueryData(
                "getRoles",
                undefined,
                draft => {
                  if (
                    typeof message.payload === "object" &&
                    "id" in message.payload
                  ) {
                    draft.push(message.payload)
                  }
                },
              ),
            )
            setMessage(null)
            break
          case "role_deleted":
            dispatch(
              rolesApiSlice.util.updateQueryData(
                "getRoles",
                undefined,
                draft => {
                  const deletedRoleId = message.payload.role_id
                  const deleteIndex = draft.findIndex(
                    role => role.id === deletedRoleId,
                  )
                  if (deleteIndex !== -1) {
                    draft.splice(deleteIndex, 1)
                  }
                },
              ),
            )
            setMessage(null)
            break
          case "role_updated":
            dispatch(
              rolesApiSlice.util.updateQueryData(
                "getRoles",
                undefined,
                draft => {
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
                },
              ),
            )
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
              console.log(message)
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
                    draft.push(message.payload.user)
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
                // dispatch(setUser(updatedUser))
                // if the role was changed, the socket must disconnected and reconnected again to the new updated role
                if (updatedUser.user.role?.id !== user.user.role?.id) {
                  reconnect()
                }
              }
            }
            break
          case "user_deleted":
            dispatch(
              usersApiSlice.util.updateQueryData(
                "getUsers",
                { skip: 0, limit: 100 },
                draft => {
                  const deletedUserId = message.payload.user_id
                  const deleteIndex = draft.findIndex(
                    u => u.id === deletedUserId,
                  )
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
            break
          case "services":
            break
          default:
            console.warn("Unhandled message type:", message)
        }
      }
    }
  }, [user, message, dispatch, addPerm, removePerm, setCurrentUser])

  useEffect(() => {
    if (serverNotification) {
      // console.log(serverNotification)
      show(serverNotification.message, {
        severity: serverNotification.type,
        autoHideDuration: serverNotification.type === "error" ? 10000 : 3000,
      })
    }
  }, [serverNotification, show])

  const contextValue = React.useMemo(
    () => ({
      socket: socketRef.current,
      status,
      message,
      setMessage,
      reconnect,
    }),
    [status, message],
  )

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
