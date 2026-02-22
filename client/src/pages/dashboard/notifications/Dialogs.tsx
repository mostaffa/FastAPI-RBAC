import { useDialogs } from "../../../hooks/useDialogs/useDialogs"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"

const Dialogs = () => {
  const dialogs = useDialogs()
  const { alert, prompt, confirm } = dialogs
  const handleShowDialog = (type: "alert" | "prompt" | "confirm") => {
    switch (type) {
      case "alert":
        void (() =>
          alert("This is a success dialog notification.", {
            title: "Success",
            okText: "OK",
          }).then(() => {
            console.log("Alert dialog closed")
          }))()
        break
      case "prompt":
        void (() =>
          prompt("Please enter your name:", {
            title: "User Input",
            okText: "Submit",
            cancelText: "Cancel",
          }).then(result => {
            if (result !== null) {
              void (async () => {
                await alert(`Hello, ${result}!`, {
                  title: "Greetings",
                  okText: "OK",
                })
              })()
            }
          }))()
        break
      case "confirm":
        void (() =>
          confirm("Are you sure you want to proceed?", {
            title: "Confirmation",
            okText: "Yes",
            cancelText: "No",
          }).then(result => {
            if (result) {
              void (async () => {
                await alert("You confirmed the action.", {
                  title: "Confirmed",
                  okText: "OK",
                })
              })()
            }
          }))()
        break
    }
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Dialogs
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              This section demonstrates how to trigger different types of dialog
              notifications using the dialog system.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Using dialog hooks.
            </Typography>
            <ButtonGroup
              variant="outlined"
              aria-label="outlined primary button group"
              sx={{ p: 2 }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleShowDialog("alert")
                }}
                sx={{ mr: 1 }}
              >
                Show Alert Dialog
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleShowDialog("prompt")
                }}
                sx={{ mr: 1 }}
              >
                Show Prompt Dialog
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleShowDialog("confirm")
                }}
                sx={{ mr: 1 }}
              >
                Show Confirm Dialog
              </Button>
            </ButtonGroup>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" gutterBottom>
              Code Example
            </Typography>
            <Typography component={"pre"} variant="body1" gutterBottom>
              {`const { alert, prompt, confirm } = useDialogs();  
       
const handleShowDialog = () => {
    void (() => alert("This is a success dialog notification.",{
        title: "Success",
        okText: "OK",
    }).then(() => {
        console.log("Alert dialog closed");
    }))();
};`}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
export default Dialogs
