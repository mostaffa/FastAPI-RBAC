import type { UserRead } from "@/api"
import { ApiError, UsersService } from "@/api"
import { useAppSelector } from "@/app/hooks"
import { useGetUsersQuery } from "@/features/user/usersApiSlice"
import { selectPermissions, selectUser } from "@/features/user/userSlice"
import { useDialogs } from "@/hooks/useDialogs/useDialogs"
import useNotifications from "@/hooks/useNotifications/useNotifications"
import DeleteIcon from "@mui/icons-material/Delete"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useCallback } from "react"
import UserForm from "./UserForm"

const Users = () => {
  const dialogs = useDialogs()
  const notifications = useNotifications()
  const { data: users } = useGetUsersQuery({ skip: 0, limit: 100 })
  const user = useAppSelector(selectUser)
  const permissions = useAppSelector(selectPermissions)

  const handleCreateNewUser = useCallback(async () => {
    await dialogs.contentDialog(<UserForm createNew />, {
      title: "Create New User",
    })
  }, [dialogs])

  const handleEditUser = useCallback(
    async (user: UserRead) => {
      await dialogs.contentDialog(<UserForm userId={user.id} />, {
        title: `Edit ${user.username} User`,
      })
    },
    [dialogs],
  )

  const handleDeleteUser = useCallback(
    async (user: UserRead) => {
      const confirm = await dialogs.confirm(
        <Typography variant="body1" p={2}>
          Are you sure you want to delete {user.username}? This action cannot be
          undone.
        </Typography>,
        {
          title: `Delete ${user.username} User`,
          okText: "Delete",
          severity: "error",
        },
      )
      if (confirm) {
        try {
          await UsersService.deleteUserApiV1UsersUserIdDelete({
            userId: user.id,
          })
          notifications.show("User deleted successfully", {
            severity: "success",
            autoHideDuration: 3000,
          })
        } catch (error) {
          if (error instanceof ApiError) {
            notifications.show(error.message, {
              severity: "error",
              autoHideDuration: 5000,
            })
          } else {
            notifications.show("An unexpected error occurred", {
              severity: "error",
              autoHideDuration: 5000,
            })
          }
        }
      }
    },
    [dialogs, notifications],
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
            Users
          </Typography>
          <Typography variant="body1">
            All available users in the system are listed here. You can view the
            roles associated with each user and manage them as needed.
          </Typography>
        </Grid>
        {permissions?.includes("user:create") && (
          <Grid
            size={{ xs: 12, sm: 12, md: 4, lg: 4, xl: 4 }}
            component={Paper}
            elevation={3}
            sx={{ p: 2 }}
          >
            <Typography variant="h5" gutterBottom>
              Create a new user
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                void (async () => {
                  await handleCreateNewUser()
                })()
              }}
            >
              New User
            </Button>
          </Grid>
        )}
      </Grid>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {users?.map(u => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id} position="relative">
            <Grid component={Paper} elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">
                {u.username} {u.username === user?.username ? "(You)" : ""}
              </Typography>
              <ButtonGroup variant="outlined" size="small" sx={{ mt: 1 }}>
                {permissions?.includes("user:update") && (
                  <Button
                    onClick={() => {
                      void (async () => {
                        await handleEditUser(u)
                      })()
                    }}
                  >
                    Edit
                  </Button>
                )}
              </ButtonGroup>
            </Grid>
            {permissions?.includes("user:delete") && (
              <IconButton
                disabled={u.id === 1} // Disable delete button for superuser role
                aria-label="delete"
                color="error"
                size="small"
                sx={{ position: "absolute", top: 8, right: 8 }}
                onClick={() => {
                  void (async () => {
                    await handleDeleteUser(u)
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

export default Users
