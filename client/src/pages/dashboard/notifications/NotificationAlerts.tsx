// use the alert hook and alerts options
import useNotifications from "../../../hooks/useNotifications/useNotifications"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"

const NotificationAlerts = () => {
  const { show } = useNotifications()
  const handleShowAlert = (type: "success" | "error" | "warning" | "info") => {
    show(`This is a ${type} alert message!`, {
      severity: type,
      autoHideDuration: 3000,
    })
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              This section demonstrates how to trigger different types of alert
              notifications using the notification system.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Using notification hooks.
            </Typography>
            <ButtonGroup
              variant="contained"
              aria-label="outlined primary button group"
              sx={{ p: 2 }}
            >
              <Button
                color="success"
                onClick={() => {
                  handleShowAlert("success")
                }}
                sx={{ mr: 1 }}
              >
                Show Success Alert
              </Button>
              <Button
                color="error"
                onClick={() => {
                  handleShowAlert("error")
                }}
                sx={{ mr: 1 }}
              >
                Show Error Alert
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={() => {
                  handleShowAlert("warning")
                }}
                sx={{ mr: 1 }}
              >
                Show Warning Alert
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={() => {
                  handleShowAlert("info")
                }}
              >
                Show Info Alert
              </Button>
            </ButtonGroup>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
export default NotificationAlerts
