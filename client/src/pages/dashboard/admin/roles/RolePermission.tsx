import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useAppDispatch } from "@/app/hooks"
import {
  useGetRolePermissionsQuery,
  rolesApiSlice,
} from "@/features/user/rolesApiSlice"
import { useGetPermissionsQuery } from "@/features/user/permissionApiSlice"
import type { PermissionRead } from "@/api"
import { RolesService } from "@/api"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Switch from "@mui/material/Switch"
import Typography from "@mui/material/Typography"
import Loader from "@/components/ui/loader/Loader"
import useNotifications from "@/hooks/useNotifications/useNotifications"

const RolePermission: React.FC<{ roleId: number }> = ({ roleId }) => {
  const dispatch = useAppDispatch()
  const notifications = useNotifications()
  const [pendingPermissionId, setPendingPermissionId] = useState<number | null>(
    null,
  )
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

    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.name.localeCompare(b.name))
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
              })
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
      setPendingPermissionId(permissionId)
      try {
        if (event) {
          await RolesService.assignPermissionToRoleApiV1RolesRoleIdPermissionsPermissionIdPost(
            {
              roleId: roleId,
              permissionId: permissionId, // Example permission ID to assign, replace with actual logic
            },
          )
          // if socket is connected, optimistically update UI
          // if (status !== "connected") {
          updateView(roleId, permissionId, "role_permission_added")
          // }
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
          // if (status !== "connected") {
          updateView(roleId, permissionId, "role_permission_removed")
          // }
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
        setPendingPermissionId(null)
      }
    },
    [roleId, notifications, updateView],
  )

  useEffect(() => {
    if (allPermissions) {
      const grouped = groupPermissionsHelper(allPermissions)
      setGroupedPermissions(grouped)
    }
  }, [allPermissions])

  if (isRolePermissionsLoading || isAllPermissionsLoading) {
    return <Loader />
  }

  const totalPermissions = allPermissions?.length ?? 0
  const assignedCount = rolePermissions?.length ?? 0
  const sortedGroups = Object.entries(groupedPermissions).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.5 },
        mx: "auto",
        maxHeight: "min(70vh, 620px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography variant="h6" fontWeight={700}>
            Role Permissions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${String(assignedCount)} assigned`} color="primary" />
            <Chip
              label={`${String(totalPermissions)} total`}
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Toggle permissions on or off for this role. Changes are saved
          immediately.
        </Alert>

        <Grid container spacing={1.5}>
          {sortedGroups.map(([group, permissions]) => (
            <Grid key={group} size={{ xs: 12 }}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  height: "100%",
                  // borderColor: "divider",
                }}
              >
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        {group}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${String(permissions.length)} perms`}
                        variant="outlined"
                      />
                    </Stack>

                    <Stack
                      spacing={0.5}
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        // bgcolor: "background.default",
                        border: theme => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {permissions.map(permission => {
                        const permissionName =
                          permission.name.split(":")[1] ?? permission.name
                        const checked =
                          rolePermissions?.some(
                            rp => rp.id === permission.id,
                          ) ?? false

                        return (
                          <Box
                            key={permission.id}
                            sx={{
                              px: 0.75,
                              py: 0.5,
                              borderRadius: 1.5,
                              "&:hover": {
                                bgcolor: "action.hover",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                m: 0,
                                width: "100%",
                                gap: 2,
                                minWidth: 0,
                              }}
                            >
                              <Stack
                                spacing={0.2}
                                sx={{ minWidth: 0, flex: 1 }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    textTransform: "capitalize",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {permissionName.split("_").join(" ")}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ overflowWrap: "anywhere" }}
                                >
                                  {permission.name}
                                </Typography>
                              </Stack>

                              <Switch
                                checked={checked}
                                disabled={pendingPermissionId === permission.id}
                                onChange={e => {
                                  void (async () => {
                                    await handleChange(
                                      e.target.checked,
                                      permission,
                                    )
                                  })()
                                }}
                              />
                            </Box>
                          </Box>
                        )
                      })}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  )
}

export default RolePermission
