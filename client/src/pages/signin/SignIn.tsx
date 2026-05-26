import * as React from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CssBaseline from "@mui/material/CssBaseline"
import FormControlLabel from "@mui/material/FormControlLabel"
import Divider from "@mui/material/Divider"
import Link from "@mui/material/Link"
import { Link as reactLink } from "react-router"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"
import MuiCard from "@mui/material/Card"
import { styled } from "@mui/material/styles"
import AppTheme from "../../theme/AppTheme"
import ColorModeSelect from "../../theme/ColorModeSelect"
import {
  GoogleIcon,
  FacebookIcon,
  SitemarkIcon,
} from "../../components/signin/CustomIcons"
import { useForm, Controller } from "react-hook-form"
import { useAuth } from "@/hooks/useAuth/useAuth"

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}))

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}))

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const { login } = useAuth()

  const { getValues, control } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const handleSubmit = React.useCallback(async () => {
    const { username, password } = getValues()
    try {
      await login(username, password)
    } catch (error: unknown) {
      alert("Login failed. Please check your credentials and try again.")
      console.error("Login error:", error)
    }
  }, [getValues, login])

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        />
        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={e => {
              void (async () => {
                e.preventDefault()
                await handleSubmit()
              })()
            }}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Username"
                  id="username"
                  autoComplete="username"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  fullWidth
                  variant="outlined"
                />
              )}
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={e => {
                void (async () => {
                  e.preventDefault()
                  await handleSubmit()
                })()
              }}
            >
              Sign in
            </Button>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                alert("Sign in with Google")
              }}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                alert("Sign in with Facebook")
              }}
              startIcon={<FacebookIcon />}
            >
              Sign in with Facebook
            </Button>
            <Typography sx={{ textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                component={reactLink}
                variant="body2"
                sx={{ alignSelf: "center" }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  )
}
