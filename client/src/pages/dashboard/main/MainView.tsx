import { useTheme } from "@mui/material"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"

export default function MainView() {
  const theme = useTheme()
  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        backgroundColor: theme.vars.palette.background.default,
      }}
    >
      <Box component={Paper} elevation={5} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Main View
        </Typography>
        <Typography>
          Welcome to the Dashboard! This is the main view where you can find an
          overview of your data and activities.
        </Typography>
      </Box>
    </Container>
  )
}
