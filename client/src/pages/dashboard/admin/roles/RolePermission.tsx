import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useAppDispatch } from "../../../../app/hooks"
import {
  useGetRolePermissionsQuery,
  rolesApiSlice,
} from "../../../../features/user/rolesApiSlice"
import { useGetPermissionsQuery } from "../../../../features/user/permissionApiSlice"
import type { PermissionRead } from "../../../../api"
import { RolesService } from "../../../../api"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import InputLabel from "@mui/material/InputLabel"
import Checkbox from "@mui/material/Checkbox"
import Loader from "../../../../components/ui/loader/Loader"
import useNotifications from "../../../../hooks/useNotifications/useNotifications"
import useSocket from "../../../../hooks/useSocket/useSocket"

const RolePermission: React.FC<{ roleId: number }> = ({ roleId }) => {
  const dispatch = useAppDispatch()
  const { status } = useSocket()
  const notifications = useNotifications()
  const [disabled, setDisabled] = useState(false)
  const { data: rolePermissions, isLoading: isRolePermissionsLoading } =
    useGetRolePermissionsQuery(roleId)
  const { data: allPermissions, isLoading: isAllPermissionsLoading } =
    useGetPermissionsQuery(undefined)
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, PermissionRead[]>
  >({})

  const groupPermissionsHelper = (permissions: PermissionRead[]) => {
    const grouped: Record<string, PermissionRead[]> = {}
    permissions.forEach(permission => {
      const [group] = permission.name.split(":")
      if (!(group in grouped)) {
        grouped[group] = []
      }
      grouped[group].push(permission)
    })
    return grouped
  }

  const updateView = useCallback(
    (roleId: number, permissionId: number, status: string) => {
      if (status === "role_permission_added") {
        dispatch(
          rolesApiSlice.util.updateQueryData(
            "getRolePermissions",
            roleId,
            draft => {
              draft.push({
                id: permissionId,
                name: `permission:${String(permissionId)}`,
              } as PermissionRead)
            },
          ),
        )
        notifications.show("A permission was added to a role", {
          severity: "info",
          autoHideDuration: 3000,
        })
      } else if (status === "role_permission_removed") {
        dispatch(
          rolesApiSlice.util.updateQueryData(
            "getRolePermissions",
            roleId,
            draft => {
              const index = draft.findIndex(p => p.id === permissionId)
              if (index !== -1) {
                draft.splice(index, 1)
              }
            },
          ),
        )
        notifications.show("A permission was removed from a role", {
          severity: "info",
          autoHideDuration: 3000,
        })
      }
    },
    [dispatch, notifications],
  )

  const handleChange = useCallback(
    async (event: boolean, permission: PermissionRead) => {
      const permissionId = permission.id
      setDisabled(true)
      try {
        if (event) {
          await RolesService.assignPermissionToRoleApiV1RolesRoleIdPermissionsPermissionIdPost(
            {
              roleId: roleId,
              permissionId: permissionId, // Example permission ID to assign, replace with actual logic
            },
          )
          // if socket is connected, optimistically update UI
          if (status !== "connected") {
            updateView(roleId, permissionId, "role_permission_added")
          }
          notifications.show("Permission added to role", {
            severity: "success",
            autoHideDuration: 3000,
          })
        } else {
          await RolesService.removePermissionFromRoleApiV1RolesRoleIdPermissionsPermissionIdDelete(
            {
              roleId: roleId,
              permissionId: permissionId, // Example permission ID to remove, replace with actual logic
            },
          )
          if (status !== "connected") {
            updateView(roleId, permissionId, "role_permission_removed")
          }
          notifications.show("Permission removed from role", {
            severity: "success",
            autoHideDuration: 3000,
          })
        }
      } catch (error) {
        console.error("Error toggling permission:", error)
        notifications.show("Failed to toggle permission", {
          severity: "error",
          autoHideDuration: 5000,
        })
      } finally {
        setDisabled(false)
      }
    },
    [roleId, notifications, updateView, status],
  )

  // useEffect(() => {
  //   if (
  //     message?.type === "role_permission_added" &&
  //     typeof message.payload === "object"
  //   ) {
  //     if (
  //       "role" in message.payload &&
  //       "permission" in message.payload &&
  //       typeof message.payload.role.id === "number" &&
  //       typeof message.payload.permission.id === "number"
  //     ) {
  //       if (roleId === message.payload.role.id) {
  //         updateView(
  //           message.payload.role.id,
  //           message.payload.permission.id,
  //           "role_permission_added",
  //         )
  //       }
  //     }
  //   } else if (
  //     message?.type === "role_permission_removed" &&
  //     typeof message.payload === "object"
  //   ) {
  //     if (
  //       "role" in message.payload &&
  //       "permission" in message.payload &&
  //       typeof message.payload.role.id === "number" &&
  //       typeof message.payload.permission.id === "number"
  //     ) {
  //       if (roleId === message.payload.role.id) {
  //         updateView(
  //           message.payload.role.id,
  //           message.payload.permission.id,
  //           "role_permission_removed",
  //         )
  //       }
  //     }
  //   }
  // }, [message, updateView, roleId])

  useEffect(() => {
    if (allPermissions) {
      const grouped = groupPermissionsHelper(allPermissions)
      setGroupedPermissions(grouped)
    }
  }, [allPermissions])

  if (isRolePermissionsLoading || isAllPermissionsLoading) {
    return <Loader />
  }

  return (
    <Grid maxWidth={"xl"} p={1}>
      <Grid>
        {/* <Typography variant="h6">Permissions</Typography> */}
        <Grid sx={{ p: 1 }} container spacing={1}>
          {Object.entries(groupedPermissions).map(([group, permissions]) => (
            <Grid component={Paper} elevation={3} key={group}>
              <Grid size={12} sx={{ mt: 1, p: 1 }}>
                <Typography variant="subtitle1">{group}</Typography>
              </Grid>
              <Grid
                size={12}
                container
                spacing={1}
                sx={{ pl: 1, pr: 1, pb: 2 }}
              >
                {permissions.map(permission => (
                  <Grid
                    key={permission.id}
                    sx={{ p: 0 }}
                    flexDirection={"row"}
                    display={"flex"}
                    alignItems={"center"}
                    alignContent={"center"}
                    justifyContent={"center"}
                  >
                    <InputLabel
                      id={`permission-${String(permission.id)}-label`}
                    >
                      {permission.name.split(":")[1]}{" "}
                      {/* Display action part of permission */}
                    </InputLabel>
                    <Checkbox
                      disabled={disabled}
                      checked={
                        rolePermissions?.some(rp => rp.id === permission.id) ??
                        false
                      }
                      onChange={e => {
                        void (async () => {
                          await handleChange(e.target.checked, permission)
                        })()
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default RolePermission
