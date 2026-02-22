import React, { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { useAppSelector, useAppDispatch } from "../../app/hooks"
import {
  selectUser,
  // selectPermissions,
  addPermission,
  removePermission,
  setUser,
} from "../../features/user/userSlice"
import SocketContext from "./SocketContext"
import type { ReactNode } from "react"
import type { Socket } from "socket.io-client"
import type { UserRead, RoleRead, PermissionRead, UserOut } from "../../api"
import { rolesApiSlice } from "../../features/user/rolesApiSlice"
import { usersApiSlice } from "../../features/user/usersApiSlice"

type SocketProviderProps = {
  children: ReactNode
}

export type SocketMessage = {
  type:
    | "notification"
    | "error"
    | "user_created"
    | "user_updated"
    | "user_deleted"
    | "role_created"
    | "role_updated"
    | "role_deleted"
    | "role_permission_added"
    | "role_permission_removed"
  payload:
    | UserRead
    | RoleRead
    | PermissionRead
    | string
    | number
    | { role_id: number }
    | { user_id: number }
    | { role: RoleRead; permission: PermissionRead }
    | { message: string }
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const dispatch = useAppDispatch()
  const WS_PATH = (import.meta.env.VITE_WS_PATH as string | undefined) ?? "/ws"
  //   const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;
  const user = useAppSelector(selectUser)
  // const permissions = useAppSelector(selectPermissions)
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState("disconnected")
  const [message, setMessage] = useState<SocketMessage | null>(null)

  useEffect(() => {
    socketRef.current ??= io({
      withCredentials: true,
      autoConnect: true,
      path: WS_PATH,
      transports: ["websocket"],
    })
    if (!user) {
      if (socketRef.current.connected) {
        socketRef.current.disconnect()
      }
      socketRef.current = null
      // }
      return
    }
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
      // console.log(`\u001b[36mMessage received: ${JSON.stringify(message)}\u001b[0m`);
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("reconnect_attempt")
      socket.off("msg")
      // socket?.disconnect();
      // socketRef.current = null;
      // console.log(`\u001b[31mSocket disconnected on cleanup\u001b[0m`);
    }
  }, [user, WS_PATH])

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
          case "notification":
            // Handle notification messages (e.g., show a toast)
            console.log(
              `Notification: ${typeof message.payload === "object" ? JSON.stringify(message.payload) : String(message.payload)}`,
            )
            break
          case "error":
            // Handle error messages (e.g., show an error alert)
            console.error(
              `Error: ${typeof message.payload === "object" ? JSON.stringify(message.payload) : String(message.payload)}`,
            )
            break
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
                    draft.push(message.payload as RoleRead)
                  }
                },
              ),
            )
            break
          case "role_deleted":
            dispatch(
              rolesApiSlice.util.updateQueryData(
                "getRoles",
                undefined,
                draft => {
                  const deletedRoleId = (message.payload as { role_id: number })
                    .role_id
                  const deleteIndex = draft.findIndex(
                    role => role.id === deletedRoleId,
                  )
                  if (deleteIndex !== -1) {
                    draft.splice(deleteIndex, 1)
                  }
                },
              ),
            )
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
                    const updatedRole = message.payload as RoleRead
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
            break
          case "role_permission_added": {
            const permissionToAdd = (
              message.payload as { role: RoleRead; permission: PermissionRead }
            ).permission
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
              user.role?.id === (message.payload as { role: RoleRead }).role.id
            ) {
              dispatch(addPermission(permissionToAdd.name))
            }
            break
          }
          case "role_permission_removed": {
            const permissionToRemove = (
              message.payload as { role: RoleRead; permission: PermissionRead }
            ).permission
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
              user.role?.id === (message.payload as { role: RoleRead }).role.id
            ) {
              dispatch(removePermission(permissionToRemove.name))
            }
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
                    draft.push((message.payload as { user: UserRead }).user)
                  }
                },
              ),
            )
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
                    const updatedUser = (message.payload as { user: UserRead })
                      .user
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
              if (updatedUser.user.id === user.id) {
                dispatch(setUser(updatedUser))
                // if the role was changed, the socket must disconnected and reconnected again to the new updated role
                if (updatedUser.user.role?.id !== user.role?.id) {
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
                  const deletedUserId = (message.payload as { user_id: number })
                    .user_id
                  const deleteIndex = draft.findIndex(
                    u => u.id === deletedUserId,
                  )
                  if (deleteIndex !== -1) {
                    draft.splice(deleteIndex, 1)
                  }
                },
              ),
            )
            break
          default:
            console.warn("Unhandled message type:", message.type)
        }
      }
      // if (typeof message.payload === "object") {
      //   if (
      //     message.type === "role_permission_added" &&
      //     "role" in message.payload &&
      //     "permission" in message.payload
      //   ) {
      //     if (user.role?.id === message.payload.role.id) {
      //       const payload = message.payload as {
      //         role: RoleRead
      //         permission: PermissionRead
      //       }
      //       dispatch(addPermission(payload.permission.name))
      //     }
      //   } else if (
      //     message.type === "role_permission_removed" &&
      //     "role" in message.payload &&
      //     "permission" in message.payload
      //   ) {
      //     if (user.role?.id === message.payload.role.id) {
      //       const payload = message.payload as {
      //         role: RoleRead
      //         permission: PermissionRead
      //       }
      //       dispatch(removePermission(payload.permission.name))
      //     }
      //   }
      // }
    }
  }, [user, message, dispatch])

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
