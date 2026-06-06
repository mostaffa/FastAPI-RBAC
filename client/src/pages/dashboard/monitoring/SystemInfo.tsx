import * as React from "react"
import ComputerIcon from "@mui/icons-material/Computer"
import DnsIcon from "@mui/icons-material/Dns"
import MemoryIcon from "@mui/icons-material/Memory"
import RefreshIcon from "@mui/icons-material/Refresh"
import StorageIcon from "@mui/icons-material/Storage"
import Avatar from "@mui/material/Avatar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import LinearProgress from "@mui/material/LinearProgress"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useGetSystemInfoQuery } from "@/features/sensors/systemApiSlice"

function formatBytes(bytes?: number | null): string {
  if (bytes === null || bytes === undefined) return "N/A"
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

function formatUptime(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return "N/A"
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  return `${String(days)}d ${String(hours)}h ${String(minutes)}m`
}

function formatCount(value?: number | null): string {
  return value === null || value === undefined ? "N/A" : String(value)
}

function usagePercent(used?: number | null, total?: number | null): number {
  if (used === null || used === undefined) return 0
  if (total === null || total === undefined || total <= 0) return 0
  return Math.min(100, Math.max(0, (used / total) * 100))
}

type StatCardProps = {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card elevation={1} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

function PageShell({
  title,
  subtitle,
  onRefresh,
  refreshing,
}: {
  title: string
  subtitle: string
  onRefresh: () => void
  refreshing: boolean
}) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        border: theme => `2px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "start", sm: "center" }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <ComputerIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Stack>
    </Paper>
  )
}

export default function SystemInfo() {
  const query = useGetSystemInfoQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const { data, isLoading, isFetching, isError } = query
  const handleRefetch = React.useCallback(() => {
    void query.refetch()
  }, [query])

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageShell
          title="System Information"
          subtitle="Host machine details from /api/v1/system"
          onRefresh={handleRefetch}
          refreshing={isFetching}
        />

        <Grid container spacing={1.5} sx={{ mt: 2 }}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))}
        </Grid>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageShell
          title="System Information"
          subtitle="Host machine details from /api/v1/system"
          onRefresh={handleRefetch}
          refreshing={isFetching}
        />

        <Paper elevation={1} sx={{ mt: 2, p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Failed to load system information.
          </Typography>
          <Button variant="contained" onClick={handleRefetch}>
            Try Again
          </Button>
        </Paper>
      </Container>
    )
  }

  const systemInfo = data
  const memUsed =
    systemInfo.memory_total_bytes !== null &&
    systemInfo.memory_total_bytes !== undefined &&
    systemInfo.memory_available_bytes !== null &&
    systemInfo.memory_available_bytes !== undefined
      ? systemInfo.memory_total_bytes - systemInfo.memory_available_bytes
      : null
  const memPercent = usagePercent(memUsed, systemInfo.memory_total_bytes)
  const diskPercent = usagePercent(
    systemInfo.disk_used_bytes,
    systemInfo.disk_total_bytes,
  )

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <PageShell
        title="System Information"
        subtitle="Host machine details from /api/v1/system"
        onRefresh={handleRefetch}
        refreshing={isFetching}
      />

      <Grid container spacing={1.5} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="Hostname" value={systemInfo.hostname} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="FQDN" value={systemInfo.fqdn} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard
                label="Platform"
                value={`${systemInfo.os_name} ${systemInfo.os_release}`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="Architecture" value={systemInfo.architecture} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="Processor" value={systemInfo.processor} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard
                label="CPU Cores"
                value={`${formatCount(systemInfo.cpu_count_physical)} physical / ${formatCount(systemInfo.cpu_count_logical)} logical`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="Python" value={systemInfo.python_version} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard label="Timezone" value={systemInfo.timezone} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <StatCard
                label="Uptime"
                value={formatUptime(systemInfo.uptime_seconds)}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Environment
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={systemInfo.is_vm ? "VM" : "Not VM"}
                  color={systemInfo.is_vm ? "warning" : "default"}
                  size="small"
                />
                <Chip
                  label={systemInfo.is_docker ? "Docker" : "No Docker"}
                  color={systemInfo.is_docker ? "info" : "default"}
                  size="small"
                />
                <Chip
                  label={
                    systemInfo.is_kubernetes ? "Kubernetes" : "No Kubernetes"
                  }
                  color={systemInfo.is_kubernetes ? "success" : "default"}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Virtualization hint: {systemInfo.virtualization_hint ?? "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                MAC Address: {systemInfo.mac_address ?? "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Boot Time (UTC): {systemInfo.boot_time_utc ?? "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                IPs:{" "}
                {systemInfo.ip_addresses.length > 0
                  ? systemInfo.ip_addresses.join(", ")
                  : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <MemoryIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Memory
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {`Used ${formatBytes(memUsed)} of ${formatBytes(systemInfo.memory_total_bytes)}`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={memPercent}
                sx={{ height: 12, borderRadius: 999 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {`${memPercent.toFixed(1)}% used`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <StorageIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Disk
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {`Used ${formatBytes(systemInfo.disk_used_bytes)} of ${formatBytes(systemInfo.disk_total_bytes)}`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={diskPercent}
                sx={{ height: 12, borderRadius: 999 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {`${diskPercent.toFixed(1)}% used`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card
            elevation={0}
            sx={{ border: theme => `1px dashed ${theme.palette.divider}` }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <DnsIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Auto-refreshes every 30 seconds and refreshes on window
                  focus/reconnect.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
