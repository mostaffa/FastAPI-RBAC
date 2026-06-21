import type { RoleRead } from "@/api"
import { RolesService } from "@/api"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import Loader from "@/components/ui/loader/Loader"
import {
  rolesApiSlice,
  useGetRolesQuery,
  useUpdateRoleMutation,
} from "@/features/user/rolesApiSlice"
import { selectPermissions } from "@/features/user/userSlice"
import { useDialogs } from "@/hooks/useDialogs/useDialogs"
import useNotifications from "@/hooks/useNotifications/useNotifications"
import useSocket from "@/hooks/useSocket/useSocket"
import DeleteIcon from "@mui/icons-material/Delete"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Container from "@mui/material/Container"
import FormControl from "@mui/material/FormControl"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { lazy, Suspense, useCallback } from "react"
import { Controller, useForm } from "react-hook-form"

const CreateRole = lazy(() => import("./CreateRole"))
const RolePermission = lazy(() => import("./RolePermission"))

type ModifyRoles = {
  status: "update" | "delete" | "create"
  role: RoleRead
}

const Roles = () => {
  const permissions = useAppSelector(selectPermissions)
  // const user = useAppSelector(selectUser);
  const { data: roles = [] } = useGetRolesQuery(undefined, {
    skip: !permissions?.includes("role:read"),
  })
  const { status } = useSocket()
  const dialogs = useDialogs()
  const dispatch = useAppDispatch()
  const notifications = useNotifications()
  const [updateRole] = useUpdateRoleMutation()

  const { setValue, control, getValues } = useForm<RoleRead>({
    defaultValues: {
      name: "",
      id: 0,
    },
  })

  const refreshRoles = useCallback(
    (roleStatus: ModifyRoles) => {
      const updatedRole = roleStatus.role
      switch (roleStatus.status) {
        case "update": {
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              const index = draft.findIndex(role => role.id === updatedRole.id)
              if (index !== -1) {
                draft[index].name = updatedRole.name
              }
            }),
          )
          break
        }
        case "delete": {
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              const index = draft.findIndex(role => role.id === updatedRole.id)
              if (index !== -1) {
                draft.splice(index, 1)
              }
            }),
          )
          break
        }
        case "create": {
          dispatch(
            rolesApiSlice.util.updateQueryData("getRoles", undefined, draft => {
              draft.push(updatedRole)
            }),
          )
          break
        }
      }
    },
    [dispatch],
  )

  const getErrorDetail = (error: unknown): string | null => {
    if (error && typeof error === "object" && "data" in error) {
      const data = (error as { data?: unknown }).data
      if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail
        if (typeof detail === "string") {
          return detail
        }
        if (typeof detail === "number" || typeof detail === "boolean") {
          return String(detail)
        }
        if (detail && typeof detail === "object") {
          try {
            return JSON.stringify(detail)
          } catch {
            return null
          }
        }
      }
    }
    return null
  }

  const handleEditRole = useCallback(
    (role: RoleRead) => {
      setValue("name", role.name)
      setValue("id", role.id)
      const updateDialog = dialogs.contentDialog(
        <Container>
          <Grid container spacing={2} mt={2} mb={2}>
            <Grid size={12}>
              <Controller
                name="name"
                control={control}
                defaultValue={role.name}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <TextField
                      {...field}
                      label="Role Name"
                      onChange={e => {
                        field.onChange(e.target.value)
                      }}
                      variant="outlined"
                    />
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const handleSave = async () => {
                    // if (selectedRole) {
                    try {
                      const updatedRole =
                        // await RolesService.updateRoleApiV1RolesRoleIdPut({
                        //   roleId: getValues("id"),
                        //   requestBody: {
                        //     name: getValues("name"),
                        //   },
                        // })
                        await updateRole({
                          roleId: getValues("id"),
                          roleName: getValues("name"),
                        }).unwrap()
                      notifications.show("Role updated successfully!", {
                        severity: "success",
                        autoHideDuration: 3000,
                      })
                      if (status === "disconnected" || status === "error") {
                        console.warn(
                          "WebSocket is not connected. Role update will not be reflected in real-time.",
                        )
                        refreshRoles({ status: "update", role: updatedRole })
                      }
                    } catch (error) {
                      console.error("Failed to update role:", error)
                      const detail = getErrorDetail(error)
                      if (detail) {
                        notifications.show(`Failed to update role: ${detail}`, {
                          severity: "error",
                          autoHideDuration: 5000,
                        })
                      } else {
                        notifications.show(
                          "Failed to update role. Please try again.",
                          { severity: "error", autoHideDuration: 3000 },
                        )
                      }
                    } finally {
                      await dialogs.close(updateDialog, undefined)
                      document
                        .getElementById("root")
                        ?.setAttribute("aria-hidden", "false")
                    }
                  }

                  void handleSave()
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  void (async () => {
                    await dialogs.close(updateDialog, undefined)
                    document
                      .getElementById("root")
                      ?.setAttribute("aria-hidden", "false")
                  })()
                }}
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Container>,
        {
          title: "Edit Role",
        },
      )
    },
    [
      dialogs,
      setValue,
      control,
      notifications,
      status,
      refreshRoles,
      getValues,
      updateRole,
    ],
  )

  const handleCreateNewRole = useCallback(() => {
    const createDialog = dialogs.contentDialog(
      <Suspense fallback={<Loader />}>
        <CreateRole
          onDone={() => {
            void (async () => {
              await dialogs.close(createDialog, undefined)
              document
                .getElementById("root")
                ?.setAttribute("aria-hidden", "false")
            })()
          }}
          refreshRoles={status === "disconnected" || status === "error"}
        />
      </Suspense>,
      {
        title: "Create New Role",
      },
    )
  }, [dialogs, status])

  const handleDeleteRole = useCallback(
    async (roleId: number) => {
      try {
        const confirmed = await dialogs.confirm(
          <Typography p={2}>
            Are you sure you want to delete this role? This action cannot be
            undone.
          </Typography>,
          { title: "Confirm Role Deletion" },
        )
        if (!confirmed) {
          return
        }
        await RolesService.deleteRoleApiV1RolesRoleIdDelete({ roleId })
        notifications.show("Role deleted successfully!", {
          severity: "success",
          autoHideDuration: 3000,
        })
        if (status === "disconnected" || status === "error") {
          console.warn(
            "WebSocket is not connected. Role deletion will not be reflected in real-time.",
          )
          refreshRoles({ status: "delete", role: { id: roleId, name: "" } })
        }
      } catch (error) {
        console.error("Failed to delete role:", error)
        const detail = getErrorDetail(error)
        if (detail) {
          notifications.show(`Failed to delete role: ${detail}`, {
            severity: "error",
            autoHideDuration: 5000,
          })
        } else {
          notifications.show("Failed to delete role. Please try again.", {
            severity: "error",
            autoHideDuration: 3000,
          })
        }
      } finally {
        document.getElementById("root")?.setAttribute("aria-hidden", "false")
      }
    },
    [dialogs, notifications, refreshRoles, status],
  )

  const handleViewPermissions = useCallback(
    async (roleId: number) => {
      await dialogs.contentDialog(
        <Suspense fallback={<Loader />}>
          <RolePermission roleId={roleId} />
        </Suspense>,
        {
          title: "Role Permissions",
        },
      )
    },
    [dialogs],
  )

  return (
    <Container maxWidth="xl">
      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid
          size={{ xs: 12, sm: 12, md: 8, lg: 8, xl: 8 }}
          component={Paper}
          elevation={3}
          sx={{ p: 2 }}
        >
          <Typography variant="h4" gutterBottom>
            Roles
          </Typography>
          <Typography variant="body1">
            All available roles in the system are listed here. You can view the
            permissions associated with each role and manage them as needed.
          </Typography>
        </Grid>
        {permissions?.includes("role:create") && (
          <Grid
            size={{ xs: 12, sm: 12, md: 4, lg: 4, xl: 4 }}
            component={Paper}
            elevation={3}
            sx={{ p: 2 }}
          >
            <Typography variant="h5" gutterBottom>
              Create a new role
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNewRole}
            >
              New Role
            </Button>
          </Grid>
        )}
      </Grid>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {roles.map(role => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4 }}
            key={String(role.id)}
            position="relative"
          >
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">{role.name}</Typography>
              <ButtonGroup variant="outlined" size="small" sx={{ mt: 1 }}>
                {permissions?.includes("role:update") && (
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      handleEditRole(role)
                    }}
                  >
                    Update
                  </Button>
                )}
                {permissions?.includes("permission:update") && (
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      void (async () => {
                        await handleViewPermissions(role.id)
                      })()
                    }}
                  >
                    Permissions
                  </Button>
                )}
              </ButtonGroup>
            </Paper>
            {permissions?.includes("role:delete") && (
              <IconButton
                disabled={role.id === 1} // Disable delete button for superuser role
                aria-label="delete"
                color="error"
                size="small"
                sx={{ position: "absolute", top: 8, right: 8 }}
                onClick={() => {
                  void (async () => {
                    await handleDeleteRole(role.id)
                  })()
                }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Roles
