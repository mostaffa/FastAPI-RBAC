// import { useEffect } from 'react'
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
// import useSocket from '../../../hooks/useSocket/useSocket'
// import useNotifications from '../../../hooks/useNotifications/useNotifications'

export default function Sensor() {
  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Grid component={Paper} elevation={3} p={2}>
        <Typography variant="h4">Sensors</Typography>
      </Grid>
    </Container>
  )
}
