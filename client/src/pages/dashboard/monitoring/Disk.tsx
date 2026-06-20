import useSocket from "@/hooks/useSocket/useSocket"
import type { DiskRealtimeResponse, DiskStats } from "@/utils/types"
import { Box, LinearProgress } from "@mui/material"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { useTheme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"
import { useEffect, useMemo, useState } from "react"
import { usageColor } from "./usageColor"

const EMPTY_DISK: DiskStats = {
  path: "/",
  total: 0,
  used: 0,
  free: 0,
  percent: 0,
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

export default function Disk() {
  const theme = useTheme()
  const { socket } = useSocket()
  const [disk, setDisk] = useState<DiskStats>(EMPTY_DISK)

  useEffect(() => {
    if (!socket) return

    const handleDiskData = (payload: DiskRealtimeResponse) => {
      setDisk(payload.data)
    }

    const startRealtime = () => {
      socket.emit("disk_realtime_start", null)
    }

    socket.on("disk_realtime", handleDiskData)
    socket.on("connect", startRealtime)

    if (socket.connected) {
      startRealtime()
    }

    return () => {
      socket.emit("disk_realtime_stop", null)
      socket.off("disk_realtime", handleDiskData)
      socket.off("connect", startRealtime)
    }
  }, [socket])

  const usagePercent = useMemo(
    () => Math.min(Math.max(disk.percent, 0), 100),
    [disk.percent],
  )
  const usageBarColor = usageColor(theme, usagePercent)

  const stats = [
    { label: "Path", value: disk.path },
    { label: "Total", value: formatBytes(disk.total) },
    { label: "Used", value: formatBytes(disk.used) },
    { label: "Free", value: formatBytes(disk.free) },
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid
        component={Paper}
        elevation={2}
        sx={{ p: 2, border: `2px solid ${theme.palette.primary.main}` }}
      >
        <Typography variant="h1" textAlign="center" fontWeight="100">
          Disk
        </Typography>
      </Grid>

      <Grid container spacing={1} sx={{ mt: 2 }}>
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Disk Usage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {"Used " +
                formatBytes(disk.used) +
                " of " +
                formatBytes(disk.total)}
            </Typography>
            <Box sx={{ position: "relative" }}>
              <LinearProgress
                aria-label="Disk usage progress"
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

        {stats.map(item => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
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
