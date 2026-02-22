import { useEffect } from "react"
import { useAppSelector } from "../../../app/hooks"
import { selectUser } from "../../../features/user/userSlice"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import FormControl from "@mui/material/FormControl"
import Button from "@mui/material/Button"
import { useForm, Controller } from "react-hook-form"
import type { UserRead } from "../../../api"

export const ProfileSettings = () => {
  // const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser)

  const { setValue, control } = useForm<UserRead>({
    defaultValues: {
      username: user?.username ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email,
      active: user?.active,
      role: user?.role,
    },
  })

  useEffect(() => {
    if (user) {
      setValue("username", user.username)
      setValue("first_name", user.first_name ?? "")
      setValue("last_name", user.last_name ?? "")
      setValue("email", user.email)
      setValue("active", user.active)
      setValue("role", user.role)
    }
  }, [user, setValue])

  return (
    <Container maxWidth="xl">
      <Grid size={12} component={Paper} elevation={2} p={2} mt={2}>
        <Typography variant="h2">User Settings</Typography>
      </Grid>
      <Grid
        size={12}
        container
        spacing={1}
        component={Paper}
        elevation={2}
        p={2}
        mt={1}
      >
        <Grid size={{ xs: 12, sm: 12, md: 8, lg: 6, xl: 6 }} component="form">
          <FormControl fullWidth sx={{ p: 1 }}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Username" />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ p: 1 }}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="First Name" />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ p: 1 }}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Last Name" />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ p: 1 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth type="email" label="Email" />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ p: 1 }}>
            <Button variant="contained" color="primary" fullWidth>
              Save Changes
            </Button>
          </FormControl>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfileSettings
