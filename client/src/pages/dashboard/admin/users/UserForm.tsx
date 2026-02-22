import { useEffect } from "react"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import { useForm, Controller } from "react-hook-form"
import FormControl from "@mui/material/FormControl"
import TextField from "@mui/material/TextField"
import type { UserCreate } from "../../../../api"
import { ApiError } from "../../../../api"
import { useGetUsersQuery } from "../../../../features/user/usersApiSlice"
import { useAppSelector } from "../../../../app/hooks"
import { selectUser } from "../../../../features/user/userSlice"
import { selectPermissions } from "../../../../features/user/userSlice"
import { UsersService } from "../../../../api"
import { useGetRolesQuery } from "../../../../features/user/rolesApiSlice"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import useNotifications from "../../../../hooks/useNotifications/useNotifications"

type UserFormProps = {
  updateCurrentUser?: boolean
  userId?: number
  createNew?: boolean
}

/**
 *
 * @param param0
 * @returns
 */
const UserForm = ({ updateCurrentUser, userId, createNew }: UserFormProps) => {
  const currentUser = useAppSelector(selectUser)
  const permissions = useAppSelector(selectPermissions)
  const hasRolesReadPerm: boolean = permissions?.includes("role:read") ?? false

  const { data: roles = [] } = useGetRolesQuery(undefined, {
    skip: !hasRolesReadPerm,
  })
  const { data: users = [] } = useGetUsersQuery(
    { skip: 0, limit: 100 },
    {
      skip: createNew ?? updateCurrentUser,
    },
  )
  const user = updateCurrentUser
    ? currentUser
    : users.find(u => u.id === userId)
  const notifications = useNotifications()
  const { control, handleSubmit, getValues, setValue } = useForm<
    Omit<UserCreate, "confirm_password"> & { confirm_password: string }
  >({
    defaultValues: {
      username: user ? user.username : "",
      email: user ? user.email : "",
      password: "",
      confirm_password: "",
      active: user ? user.active : true,
      first_name: user ? user.first_name : "",
      last_name: user ? user.last_name : "",
      role_id: user ? user.role?.id : undefined,
    },
  })

  const onSubmit = async (
    data: Omit<UserCreate, "confirm_password"> & { confirm_password: string },
  ) => {
    try {
      if (user) {
        await UsersService.updateUserApiV1UsersUserIdPut({
          userId: user.id,
          requestBody: {
            id: user.id,
            username: data.username,
            email: data.email,
            active: data.active ? true : false,
            first_name: data.first_name,
            last_name: data.last_name,
            role: roles.find(r => r.id === Number(data.role_id)),
          },
        })
        notifications.show("User updated successfully", {
          severity: "success",
          autoHideDuration: 3000,
        })
      } else {
        await UsersService.createUserApiV1UsersPost({
          requestBody: {
            username: data.username,
            email: data.email,
            password: data.password,
            active: data.active ? true : false,
            first_name: data.first_name,
            last_name: data.last_name,
            role_id: Number(data.role_id),
          },
        })
        notifications.show("User created successfully", {
          severity: "success",
          autoHideDuration: 3000,
        })
      }
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

  useEffect(() => {
    if (user) {
      setValue("username", user.username)
      setValue("email", user.email)
      setValue("first_name", user.first_name ?? "")
      setValue("last_name", user.last_name ?? "")
      setValue("active", user.active)
      setValue("role_id", user.role?.id)
    }
  }, [user, setValue])

  return (
    <Container maxWidth="sm">
      <Grid component={Paper} elevation={3} sx={{ p: 4, mt: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {user ? "Edit User" : "Add New User"}
        </Typography>
        <form
          onSubmit={e => {
            e.preventDefault()
            void (async () => {
              await handleSubmit(onSubmit)()
            })()
          }}
        >
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="username"
              control={control}
              rules={{ required: "Username is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Username"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value}
                  label="Email"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="First Name"
                />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Last Name"
                />
              )}
            />
          </FormControl>
          {!user && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: "Password is required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type="password"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Controller
                  name="confirm_password"
                  control={control}
                  rules={{
                    required: "Please confirm your password",
                    validate: value =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Confirm Password"
                      type="password"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </FormControl>
            </>
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Active"
                  value={field.value ? "active" : "inactive"}
                  onChange={e => {
                    field.onChange(e.target.value === "active")
                  }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              )}
            />
          </FormControl>
          {hasRolesReadPerm && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Controller
                name="role_id"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label="Role"
                    error={!!fieldState.error}
                    value={
                      field.value && roles.some(r => r.id === field.value)
                        ? field.value
                        : ""
                    }
                    onChange={e => {
                      field.onChange(e.target.value)
                    }}
                  >
                    <MenuItem value="">Select a role</MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            {user ? "Update" : "Create"} User
          </Button>
        </form>
      </Grid>
    </Container>
  )
}

export default UserForm
