// Settings Page
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"

export default function Layout() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid component={Paper} elevation={5} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Layouts
        </Typography>
      </Grid>
      {/* some sample 2 column layout */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 6 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-6 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 6 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-6 Column
          </Typography>
        </Grid>
      </Grid>
      {/* some sample 3 column layout */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 4 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-4 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 4 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-4 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 4 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-4 Column
          </Typography>
        </Grid>
      </Grid>
      {/* some sample 3: 3|6|3 column layout */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 3 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-3 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 6 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-6 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 3 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-3 Column
          </Typography>
        </Grid>
      </Grid>
      {/* some sample 2: 3|9 column layout */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 3 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-3 Column
          </Typography>
        </Grid>
        <Grid
          component={Paper}
          size={{ xs: 12, md: 9 }}
          sx={{ flexGrow: 1, p: 2, height: 100, border: "1px solid" }}
        >
          <Typography variant="h6" gutterBottom>
            col-9 Column
          </Typography>
        </Grid>
      </Grid>
    </Container>
  )
}
