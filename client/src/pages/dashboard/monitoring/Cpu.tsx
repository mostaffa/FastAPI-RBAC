import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import useSocket from "@/hooks/useSocket/useSocket"
import { useTheme } from "@mui/material/styles"
import type { CpuRealtimeResponse, CpuStats } from "@/utils/types"
import { Box, LinearProgress } from "@mui/material"
import type { CpuDataPoint } from "./CpuChart"
import { usageColor } from "./usageColor"

const CpuChart = lazy(() => import("./CpuChart"))

const MAX_HISTORY = 60

const EMPTY_CPU: CpuStats = {
  percent: 0,
  count_logical: 0,
  count_physical: null,
  freq_current: null,
  freq_min: null,
  freq_max: null,
}

function formatMhz(value: number | null): string {
  if (value === null) return "N/A"
  return value.toFixed(0) + " MHz"
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function Cpu() {
  const theme = useTheme()
  const { socket } = useSocket()
  const [cpu, setCpu] = useState<CpuStats>(EMPTY_CPU)
  const [history, setHistory] = useState<CpuDataPoint[]>([])
  const historyRef = useRef<CpuDataPoint[]>([])

  const handleCpuData = useCallback((payload: CpuRealtimeResponse) => {
    setCpu(payload.data)
    const point: CpuDataPoint = {
      time: formatTime(new Date()),
      percent: Math.min(Math.max(payload.data.percent, 0), 100),
    }
    const next = [...historyRef.current, point]
    const trimmed =
      next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    historyRef.current = trimmed
    setHistory(trimmed)
  }, [])

  useEffect(() => {
    if (!socket) return

    const startRealtime = () => {
      socket.emit("cpu_realtime_start", null)
    }

    socket.on("cpu_realtime", handleCpuData)
    socket.on("connect", startRealtime)

    if (socket.connected) {
      startRealtime()
    }

    return () => {
      socket.emit("cpu_realtime_stop", null)
      socket.off("cpu_realtime", handleCpuData)
      socket.off("connect", startRealtime)
    }
  }, [socket, handleCpuData])

  const usagePercent = useMemo(
    () => Math.min(Math.max(cpu.percent, 0), 100),
    [cpu.percent],
  )
  const usageBarColor = usageColor(theme, usagePercent)

  const stats = [
    { label: "Logical Cores", value: String(cpu.count_logical) },
    {
      label: "Physical Cores",
      value: cpu.count_physical !== null ? String(cpu.count_physical) : "N/A",
    },
    { label: "Current Frequency", value: formatMhz(cpu.freq_current) },
    { label: "Min Frequency", value: formatMhz(cpu.freq_min) },
    { label: "Max Frequency", value: formatMhz(cpu.freq_max) },
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid
        component={Paper}
        elevation={2}
        sx={{ p: 2, border: `2px solid ${theme.palette.primary.main}` }}
      >
        <Typography variant="h1" textAlign="center" fontWeight="100">
          CPU
        </Typography>
      </Grid>

      <Grid container spacing={1} sx={{ mt: 2 }}>
        {/* Live usage bar */}
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              CPU Usage
            </Typography>
            <Box sx={{ position: "relative" }}>
              <LinearProgress
                variant="determinate"
                value={usagePercent}
                sx={{
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: theme.palette.action.hover,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: usageBarColor,
                  },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: theme.palette.getContrastText(usageBarColor),
                  fontWeight: 700,
                }}
              >
                {usagePercent.toFixed(1) + "%"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Historical area chart */}
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Usage History
            </Typography>
            <Suspense
              fallback={
                <Box sx={{ py: 2 }}>
                  <LinearProgress />
                </Box>
              }
            >
              <CpuChart data={history} />
            </Suspense>
          </Paper>
        </Grid>

        {/* Stat cards */}
        {stats.map(item => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
