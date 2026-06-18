import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
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
import type { TemperatureDataPoint } from "./TemperatureChart"

const TemperatureChart = lazy(() => import("./TemperatureChart"))

const MAX_HISTORY = 60

type TemperatureLevel = "normal" | "middle" | "warning" | "error"
type TemperatureHistoryBySensor = Record<string, TemperatureDataPoint[]>

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function normalizeTempValue(value: number): number {
  // Some sensors may report milli-degrees C (e.g. 32680 => 32.68 C).
  return value > 1000 ? value / 1000 : value
}

function summarizeSensorReadings(
  readings: SensorsTemperaturesData[string] | undefined,
): Omit<TemperatureDataPoint, "time"> | null {
  if (!readings || readings.length === 0) return null

  const normalizedCurrentValues = readings.map(([, current]) =>
    normalizeTempValue(current),
  )
  const currentAverage =
    normalizedCurrentValues.reduce((sum, value) => sum + value, 0) /
    normalizedCurrentValues.length

  const highs = readings
    .map(([, , high]) => (high !== null ? normalizeTempValue(high) : null))
    .filter((high): high is number => high !== null)
  const criticals = readings
    .map(([, , , critical]) =>
      critical !== null ? normalizeTempValue(critical) : null,
    )
    .filter((critical): critical is number => critical !== null)

  const avgHigh =
    highs.length > 0
      ? highs.reduce((sum, value) => sum + value, 0) / highs.length
      : null
  const avgCritical =
    criticals.length > 0
      ? criticals.reduce((sum, value) => sum + value, 0) / criticals.length
      : null

  return {
    current: Number(currentAverage.toFixed(2)),
    high: avgHigh !== null ? Number(avgHigh.toFixed(2)) : null,
    critical: avgCritical !== null ? Number(avgCritical.toFixed(2)) : null,
  }
}

export default function Temperature() {
  const { socket } = useSocket()
  const theme = useTheme()
  const [temperatureData, setTemperatureData] =
    useState<SensorsTemperaturesData>({})
  const [historyBySensor, setHistoryBySensor] =
    useState<TemperatureHistoryBySensor>({})
  const [activeSensor, setActiveSensor] = useState("")

  const handleTemperatureMessage = useCallback(
    (message: SensorsTemperaturesResponse) => {
      setTemperatureData(message.data)

      setHistoryBySensor(prev => {
        const timestamp = formatTime(new Date())
        const nextHistory: TemperatureHistoryBySensor = { ...prev }

        Object.entries(message.data).forEach(([sensorName, readings]) => {
          const summary = summarizeSensorReadings(readings)
          if (!summary) return

          const point: TemperatureDataPoint = {
            time: timestamp,
            current: summary.current,
            high: summary.high,
            critical: summary.critical,
          }

          const previousSeries = nextHistory[sensorName] ?? []
          const updatedSeries = [...previousSeries, point]
          nextHistory[sensorName] =
            updatedSeries.length > MAX_HISTORY
              ? updatedSeries.slice(updatedSeries.length - MAX_HISTORY)
              : updatedSeries
        })

        const incomingSensors = new Set(Object.keys(message.data))
        const filteredHistory: TemperatureHistoryBySensor = {}
        Object.entries(nextHistory).forEach(([sensorName, history]) => {
          if (incomingSensors.has(sensorName)) {
            filteredHistory[sensorName] = history
          }
        })

        return filteredHistory
      })
    },
    [],
  )

  useEffect(() => {
    if (!socket) return

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
  }, [socket, handleTemperatureMessage])

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
  const activeHistory = useMemo(
    () => historyBySensor[activeSensorName] ?? [],
    [historyBySensor, activeSensorName],
  )

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
      <Grid
        container
        spacing={1}
        sx={{
          mt: 2,
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
        }}
      >
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

              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Usage History
                </Typography>
                <Suspense
                  fallback={
                    <Box sx={{ py: 2 }}>
                      <LinearProgress aria-label="Usage History" />
                    </Box>
                  }
                >
                  <TemperatureChart data={activeHistory} />
                </Suspense>
              </Paper>

              <Grid container spacing={1}>
                {activeReadings.map(
                  ([label, current, high, critical], index) => {
                    const normalizedCurrent = normalizeTempValue(current)
                    const normalizedHigh =
                      high !== null ? normalizeTempValue(high) : null
                    const normalizedCritical =
                      critical !== null ? normalizeTempValue(critical) : null
                    const thresholds = getThresholds(
                      normalizedHigh,
                      normalizedCritical,
                    )
                    const level = getTemperatureLevel(
                      normalizedCurrent,
                      normalizedHigh,
                      normalizedCritical,
                    )
                    const progress = Math.min(
                      (normalizedCurrent / thresholds.max) * 100,
                      100,
                    )
                    const levelColor =
                      level === "error"
                        ? theme.palette.error.main
                        : level === "warning"
                          ? theme.palette.warning.main
                          : level === "middle"
                            ? theme.palette.grey[700]
                            : theme.palette.info.main

                    return (
                      <Grid
                        size={{
                          xs: 12,
                          md: index >= 2 ? 6 : 4,
                          lg: index >= 2 ? 3 : 6,
                        }}
                        key={`${activeSensorName}-${label || "unnamed"}-${String(index)}`}
                      >
                        <Grid
                          component={Paper}
                          elevation={5}
                          sx={{
                            p: 1.5,
                            border: `2px solid ${levelColor}`,
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
                            Current: {normalizedCurrent.toFixed(1)}°C
                          </Typography>
                          <Typography variant="body2">
                            High:{" "}
                            {normalizedHigh !== null
                              ? `${normalizedHigh.toFixed(1)}°C`
                              : `${thresholds.warning.toFixed(1)}°C (estimated)`}
                          </Typography>
                          <Typography variant="body2">
                            Critical:{" "}
                            {normalizedCritical !== null
                              ? `${normalizedCritical.toFixed(1)}°C`
                              : `${thresholds.error.toFixed(1)}°C (estimated)`}
                          </Typography>
                          {normalizedHigh === null ||
                          normalizedCritical === null ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Hardware thresholds unavailable from this sensor.
                            </Typography>
                          ) : null}
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
