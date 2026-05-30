import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import useSocket from "@/hooks/useSocket/useSocket"
import { useTheme } from "@mui/material/styles"
import type { MemoryRealtimeResponse, MemoryStats } from "@/utils/types"
import { Box, LinearProgress } from "@mui/material"
import MemoryChart, { type MemoryDataPoint } from "./MemoryChart"

const MAX_HISTORY = 60

const EMPTY_MEMORY: MemoryStats = {
  total: 0,
  available: 0,
  percent: 0,
  used: 0,
  free: 0,
  active: 0,
  inactive: 0,
  buffers: 0,
  cached: 0,
  shared: 0,
  slab: 0,
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

function usageColor(percent: number): string {
  if (percent >= 90) return "#c62828"
  if (percent >= 75) return "#ef6c00"
  if (percent >= 50) return "#f9a825"
  return "#1565c0"
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function Memory() {
  const theme = useTheme()
  const { socket } = useSocket()
  const [memory, setMemory] = useState<MemoryStats>(EMPTY_MEMORY)
  const [history, setHistory] = useState<MemoryDataPoint[]>([])
  const historyRef = useRef<MemoryDataPoint[]>([])

  const handleMemoryData = useCallback((payload: MemoryRealtimeResponse) => {
    setMemory(payload.data)
    const point: MemoryDataPoint = {
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
      socket.emit("mem_realtime_start", null)
    }

    socket.on("mem_realtime", handleMemoryData)
    socket.on("connect", startRealtime)

    if (socket.connected) {
      startRealtime()
    }

    return () => {
      socket.emit("mem_realtime_stop", null)
      socket.off("mem_realtime", handleMemoryData)
      socket.off("connect", startRealtime)
    }
  }, [socket, handleMemoryData])

  const usagePercent = useMemo(() => {
    if (memory.total <= 0) return 0
    return Math.min(Math.max(memory.percent, 0), 100)
  }, [memory.percent, memory.total])

  const usageBarColor = usageColor(usagePercent)

  const stats = [
    { label: "Total", value: memory.total },
    { label: "Used", value: memory.used },
    { label: "Available", value: memory.available },
    { label: "Free", value: memory.free },
    { label: "Active", value: memory.active },
    { label: "Inactive", value: memory.inactive },
    { label: "Cached", value: memory.cached },
    { label: "Buffers", value: memory.buffers },
    { label: "Shared", value: memory.shared },
    { label: "Slab", value: memory.slab },
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid
        component={Paper}
        elevation={2}
        sx={{ p: 2, border: `2px solid ${theme.palette.primary.main}` }}
      >
        <Typography variant="h1" textAlign="center" fontWeight="100">
          Memory
        </Typography>
      </Grid>

      <Grid container spacing={1} sx={{ mt: 2 }}>
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Memory Usage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {`Used ${formatBytes(memory.used)} of ${formatBytes(memory.total)}`}
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
                {`${usagePercent.toFixed(1)}%`}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Usage History
            </Typography>
            <MemoryChart data={history} />
          </Paper>
        </Grid>

        {stats.map(item => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.label}>
            <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {formatBytes(item.value)}
              </Typography>
            </Paper>
          </Grid>
        ))}

        <Grid size={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Values update in real-time from `psutil.virtual_memory()` via
              socket event `mem_realtime`.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
