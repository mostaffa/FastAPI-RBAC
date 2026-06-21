import type { UserOut } from "@/api"
import { useAuth } from "@/hooks/useAuth/useAuth"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import FormControl from "@mui/material/FormControl"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

type User = UserOut["user"]

export const ProfileSettings = () => {
  const { user } = useAuth()

  const { setValue, control } = useForm<User>({
    defaultValues: {
      username: user?.user.username ?? "",
      first_name: user?.user.first_name ?? "",
      last_name: user?.user.last_name ?? "",
      email: user?.user.email ?? "",
      active: user?.user.active ?? false,
      role: user?.user.role ?? null,
    },
  })

  useEffect(() => {
    if (user) {
      setValue("username", user.user.username)
      setValue("first_name", user.user.first_name ?? "")
      setValue("last_name", user.user.last_name ?? "")
      setValue("email", user.user.email)
      setValue("active", user.user.active)
      setValue("role", user.user.role ?? null)
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
