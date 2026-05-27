import { useEffect, useState } from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import useSocket from "@/hooks/useSocket/useSocket"
import { useTheme } from "@mui/material/styles"
import type {
  SensorsTemperaturesData,
  SensorsTemperaturesResponse,
} from "@/utils/types"
import { Box, Chip, Divider, LinearProgress, Tab, Tabs } from "@mui/material"

type TemperatureLevel = "normal" | "middle" | "warning" | "error"

function getThresholds(high: number | null, critical: number | null) {
  if (critical !== null) {
    return {
      middle: high !== null ? high * 0.75 : critical * 0.7,
      warning: high ?? critical * 0.9,
      error: critical,
      max: critical,
    }
  }

  if (high !== null) {
    return {
      middle: high * 0.75,
      warning: high,
      error: high * 1.1,
      max: high * 1.1,
    }
  }

  return {
    middle: 60,
    warning: 75,
    error: 90,
    max: 100,
  }
}

function getTemperatureLevel(
  current: number,
  high: number | null,
  critical: number | null,
): TemperatureLevel {
  const thresholds = getThresholds(high, critical)

  if (current >= thresholds.error) return "error"
  if (current >= thresholds.warning) return "warning"
  if (current >= thresholds.middle) return "middle"
  return "normal"
}

function getLevelLabel(level: TemperatureLevel) {
  if (level === "error") return "High Error"
  if (level === "warning") return "Warning"
  if (level === "middle") return "Middle"
  return "Normal"
}

export default function Temperature() {
  const { socket } = useSocket()
  const theme = useTheme()
  const [temperatureData, setTemperatureData] =
    useState<SensorsTemperaturesData>({})
  const [activeSensor, setActiveSensor] = useState("")

  useEffect(() => {
    if (!socket) return

    const handleTemperatureMessage = (message: SensorsTemperaturesResponse) => {
      setTemperatureData(message.data)
    }

    const startRealtime = () => {
      socket.emit("temp_realtime_start", null)
    }

    socket.on("temp_realtime", handleTemperatureMessage)
    socket.on("connect", startRealtime)

    if (socket.connected) {
      startRealtime()
    }

    return () => {
      socket.emit("temp_realtime_stop", null)
      socket.off("temp_realtime", handleTemperatureMessage)
      socket.off("connect", startRealtime)
    }
  }, [socket])

  const sensorNames = Object.keys(temperatureData)

  useEffect(() => {
    if (sensorNames.length === 0) {
      if (activeSensor !== "") setActiveSensor("")
      return
    }

    if (!sensorNames.includes(activeSensor)) {
      setActiveSensor(sensorNames[0])
    }
  }, [activeSensor, sensorNames])

  const activeSensorName = sensorNames.includes(activeSensor)
    ? activeSensor
    : (sensorNames[0] ?? "")
  const activeReadings = activeSensorName
    ? temperatureData[activeSensorName]
    : []

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid
        component={Paper}
        elevation={2}
        sx={{ p: 2, border: `2px solid ${theme.palette.primary.main}` }}
      >
        <Typography variant="h1" textAlign="center">
          Temperature
        </Typography>
      </Grid>
      <Grid container spacing={1} sx={{ mt: 2, border: `2px solid ${theme.palette.primary.main}`, borderRadius: 1 }}>
        {sensorNames.length === 0 ? (
          <Grid size={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography color="text.secondary">
                Waiting for live temperature data...
              </Typography>
            </Paper>
          </Grid>
        ) : (
          <Grid size={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Tabs
                value={activeSensorName}
                onChange={(_, nextValue: string) => {
                  setActiveSensor(nextValue)
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                {sensorNames.map(sensorName => (
                  <Tab
                    key={sensorName}
                    value={sensorName}
                    label={sensorName.split("_").join(" ")}
                    sx={{ textTransform: "capitalize" }}
                  />
                ))}
              </Tabs>

              <Grid container spacing={1} >
                {activeReadings.map(
                  ([label, current, high, critical], index) => {
                    const level = getTemperatureLevel(current, high, critical)
                    const thresholds = getThresholds(high, critical)
                    const progress = Math.min(
                      (current / thresholds.max) * 100,
                      100,
                    )
                    const levelColor =
                      level === "error"
                        ? theme.palette.error.main
                        : level === "warning"
                          ? theme.palette.warning.main
                          : level === "middle"
                            ? "#f9a825"
                            : theme.palette.info.main

                    return (
                      <Grid
                        size={{ xs: 12, md: index >= 2  ? 6 : 4, lg: index >= 2 ? 3 : 6 }}
                        key={`${activeSensorName}-${label || "unnamed"}-${String(index)}`}
                      >
                        <Grid
                          component={Paper}
                          elevation={5}
                          sx={{
                            p: 1.5,
                            border: `2px solid ${levelColor}`,
                            backgroundColor: theme.palette.background.default,
                            color: theme.palette.text.primary,
                            height: "100%",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2">
                              {label || "Sensor " + String(index + 1)}
                            </Typography>
                            <Chip
                              size="small"
                              label={getLevelLabel(level)}
                              sx={{
                                backgroundColor: levelColor,
                                color:
                                  theme.palette.getContrastText(levelColor),
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 10,
                              borderRadius: 999,
                              mb: 1,
                              backgroundColor: theme.palette.action.hover,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: levelColor,
                              },
                            }}
                          />
                          <Typography variant="body2">
                            Current: {current}°C
                          </Typography>
                          <Typography variant="body2">
                            High: {high !== null ? String(high) + "°C" : "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            Critical:{" "}
                            {critical !== null
                              ? String(critical) + "°C"
                              : "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    )
                  },
                )}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  )
}
