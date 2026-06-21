import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"

export default function Sensor() {
  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Grid component={Paper} elevation={3} p={2}>
        <Typography variant="h4">Sensors</Typography>
      </Grid>
    </Container>
  )
}
