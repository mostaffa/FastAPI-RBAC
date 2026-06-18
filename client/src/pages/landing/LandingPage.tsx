import type React from "react"
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material"
import { useNavigate } from "react-router"

const LandingPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const navigate = useNavigate()

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Real-time Monitoring",
      description:
        "Monitor CPU, memory, disk, and temperature metrics in real-time with interactive charts and instant alerts.",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Service Management",
      description:
        "Manage system services with ease. Start, stop, and monitor Docker and Linux services from a unified interface.",
    },
    {
      icon: <DashboardIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "System Insights",
      description:
        "Get comprehensive system information including hardware details, network status, and performance metrics.",
    },
    {
      icon: <SettingsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "User Administration",
      description:
        "Robust user management with role-based access control, permissions, and secure authentication.",
    },
  ]

  const handleGetStarted = () => {
    void (async () => {
      await navigate("/signin")
    })()
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                SystemMonitor Pro
              </Typography>
            </Box>
            {!isMobile && (
              <Box>
                <Button
                  color="inherit"
                  onClick={
                    void (async () => {
                      await navigate("/signin")
                    })()
                  }
                  sx={{ mr: 2 }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGetStarted}
                  endIcon={<ArrowForwardIcon />}
                >
                  Get Started
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
          py: { xs: 6, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                component="h1"
                fontWeight="bold"
                gutterBottom
              >
                Advanced System Monitoring & Management
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                A comprehensive platform for real-time system monitoring,
                service management, and user administration. Gain complete
                control over your infrastructure with intuitive dashboards and
                powerful analytics.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ bgcolor: "white", color: "primary.main", px: 4 }}
                >
                  Start Monitoring Now
                </Button>
              </Box>
            </Grid>
            {!isMobile && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 3,
                    p: 4,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Typography variant="h5" gutterBottom>
                    Key Features
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {features.slice(0, 3).map((feature, index) => (
                      <Box
                        key={index}
                        sx={{ mb: 2, display: "flex", alignItems: "center" }}
                      >
                        {feature.icon}
                        <Typography variant="body1" sx={{ ml: 2 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          Powerful Features for Modern Infrastructure
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 6, opacity: 0.7 }}>
          Everything you need to monitor, manage, and secure your systems in one
          place
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  height: "100%",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 8,
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: "center" }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Ready to Take Control of Your Infrastructure?
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
            Join thousands of system administrators who trust our platform for
            reliable monitoring and management.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ bgcolor: "white", color: "primary.main", px: 6 }}
          >
            Get Started for Free
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "grey.900", color: "white", py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2">
                © {new Date().getFullYear()} SystemMonitor Pro. All rights
                reserved.
              </Typography>
            </Grid>
            <Grid
              size={{ xs: 12, sm: 6 }}
              sx={{ textAlign: { xs: "center", sm: "right" } }}
            >
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Built with React & Material-UI
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
