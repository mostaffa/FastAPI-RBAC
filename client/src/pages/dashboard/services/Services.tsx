import { useMemo, useState } from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Stack from "@mui/material/Stack"
import Chip from "@mui/material/Chip"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import Switch from "@mui/material/Switch"
import FormControlLabel from "@mui/material/FormControlLabel"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import TextField from "@mui/material/TextField"
import { useTheme } from "@mui/material/styles"
import { useAuth } from "@/hooks/useAuth/useAuth"
import useNotifications from "@/hooks/useNotifications/useNotifications"
import {
  useGetServicesSnapshotQuery,
  useUpdateServiceStateMutation,
} from "@/features/sensors/servicesApiSlice"
import type { ServiceItem, ServicesSnapshot } from "@/api"

const EMPTY_SNAPSHOT: ServicesSnapshot = {
  timestamp: "",
  linux_available: false,
  docker_available: false,
  items: [],
  errors: [],
}

function formatSource(source: ServiceItem["source"]): string {
  return source === "linux" ? "Linux" : "Docker"
}

function statusColor(
  status?: string | null,
): "default" | "success" | "warning" | "error" {
  const value = (status ?? "").toLowerCase()
  if (value.includes("running") || value.includes("active")) return "success"
  if (value.includes("failed") || value.includes("dead")) return "error"
  if (value.includes("exited") || value.includes("inactive")) return "warning"
  return "default"
}

export default function Services() {
  const theme = useTheme()
  const { getPermissions } = useAuth()
  const { show } = useNotifications()
  const canUpdateServices = (getPermissions ?? []).includes("services:update")
  const [detailsEnabled, setDetailsEnabled] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [sourceTab, setSourceTab] = useState<ServiceItem["source"]>("linux")
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({})
  const [updateServiceState] = useUpdateServiceStateMutation()

  const { data: summarySnapshot } = useGetServicesSnapshotQuery(
    { includeDetails: false },
    {
      pollingInterval: 5000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  )
  const { data: detailedSnapshot } = useGetServicesSnapshotQuery(
    { includeDetails: true },
    {
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: !detailsEnabled,
    },
  )

  const snapshot: ServicesSnapshot =
    detailsEnabled && detailedSnapshot
      ? detailedSnapshot
      : (summarySnapshot ?? EMPTY_SNAPSHOT)

  const isActive = (item: ServiceItem): boolean => {
    if (typeof item.is_active === "boolean") return item.is_active
    const value = (item.state ?? item.status ?? "").toLowerCase()
    return value.includes("running") || value.includes("active")
  }

  const servicesBySource = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const filtered = snapshot.items.filter(item => {
      if (filter === "active" && !isActive(item)) return false
      if (filter === "inactive" && isActive(item)) return false
      if (
        normalizedSearch &&
        !item.name.toLowerCase().includes(normalizedSearch)
      )
        return false
      return true
    })
    const linux = filtered.filter(item => item.source === "linux")
    const docker = filtered.filter(item => item.source === "docker")
    return { linux, docker }
  }, [snapshot.items, filter, searchQuery])

  const visibleServices = servicesBySource[sourceTab]

  const handleToggleState = (item: ServiceItem, enabled: boolean) => {
    if (!canUpdateServices) return

    setPendingById(prev => ({ ...prev, [item.id]: true }))

    updateServiceState({
      source: item.source,
      name: item.name,
      enabled,
    })
      .unwrap()
      .then(response => {
        if (!response.ok) {
          show(response.message || "Failed to update service state", {
            severity: "error",
            autoHideDuration: 5000,
          })
        }
      })
      .catch((error: unknown) => {
        show(String(error) || "Failed to update service state", {
          severity: "error",
          autoHideDuration: 5000,
        })
      })
      .finally(() => {
        setPendingById(prev => ({ ...prev, [item.id]: false }))
      })
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid
        component={Paper}
        elevation={2}
        sx={{ p: 2, border: `2px solid ${theme.palette.divider}` }}
      >
        <Typography variant="h1" textAlign="center" fontWeight="100">
          Services
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "start", sm: "center" }}
          sx={{ mt: 1 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "start", sm: "center" }}
          >
            <Chip
              size="small"
              label={
                snapshot.linux_available
                  ? "Linux: available"
                  : "Linux: unavailable"
              }
              color={snapshot.linux_available ? "success" : "default"}
            />
            <Chip
              size="small"
              label={
                snapshot.docker_available
                  ? "Docker: available"
                  : "Docker: unavailable"
              }
              color={snapshot.docker_available ? "info" : "default"}
            />
            <Typography variant="caption" color="text.secondary">
              {snapshot.timestamp
                ? `Last update: ${new Date(snapshot.timestamp).toLocaleTimeString()}`
                : "Waiting for first update..."}
            </Typography>
          </Stack>
          <ToggleButtonGroup
            exclusive
            value={filter}
            size="small"
            onChange={(_, value: "all" | "active" | "inactive" | null) => {
              if (value) setFilter(value)
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Tabs
          value={sourceTab}
          onChange={(_, nextValue: ServiceItem["source"]) => {
            setSourceTab(nextValue)
          }}
          variant="fullWidth"
          sx={{ mt: 2 }}
        >
          <Tab
            value="linux"
            label={
              "Linux Services (" + String(servicesBySource.linux.length) + ")"
            }
          />
          <Tab
            value="docker"
            label={
              "Docker Services (" + String(servicesBySource.docker.length) + ")"
            }
          />
        </Tabs>
        <TextField
          fullWidth
          size="small"
          label="Search service name"
          placeholder="Type a service name"
          value={searchQuery}
          onChange={event => {
            setSearchQuery(event.target.value)
          }}
          sx={{ mt: 2 }}
        />
        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Switch
              size="small"
              checked={detailsEnabled}
              onChange={(_, checked) => {
                setDetailsEnabled(checked)
              }}
            />
          }
          label="Detailed data (ports/image), slower refresh"
        />
      </Grid>

      {snapshot.errors.length > 0 ? (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" color="warning.main" sx={{ mb: 1 }}>
            Source warnings
          </Typography>
          {snapshot.errors.map(error => (
            <Typography
              key={`${error.source}:${error.message}`}
              variant="body2"
              color="text.secondary"
            >
              {`${formatSource(error.source)}: ${error.message}`}
            </Typography>
          ))}
        </Paper>
      ) : null}

      <Paper elevation={2} sx={{ p: 2, mt: 1.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6">
            {sourceTab === "linux" ? "Linux Services" : "Docker Services"}
          </Typography>
          <Chip
            size="small"
            label={`${String(visibleServices.length)} items`}
          />
        </Stack>
        <Divider sx={{ mb: 1 }} />

        {visibleServices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No services found.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {visibleServices.map(item => (
              <Box
                key={item.id}
                sx={{
                  p: 1.25,
                  borderRadius: 1,
                  border: theme => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ wordBreak: "break-word" }}
                  >
                    {item.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      color={statusColor(item.state ?? item.status)}
                      label={item.state ?? item.status ?? "unknown"}
                    />
                    {canUpdateServices && (
                      <FormControlLabel
                        sx={{ mr: 0 }}
                        control={
                          <Switch
                            size="small"
                            checked={isActive(item)}
                            disabled={pendingById[item.id]}
                            onChange={(_, checked) => {
                              handleToggleState(item, checked)
                            }}
                          />
                        }
                        label={isActive(item) ? "On" : "Off"}
                      />
                    )}
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Source: {formatSource(item.source)}
                </Typography>
                {item.sub_state ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Sub-state: {item.sub_state}
                  </Typography>
                ) : null}
                {item.image ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", wordBreak: "break-all" }}
                  >
                    Image: {item.image}
                  </Typography>
                ) : null}
                {item.description ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", wordBreak: "break-word" }}
                  >
                    {item.description}
                  </Typography>
                ) : null}
                {item.ports ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", wordBreak: "break-word" }}
                  >
                    Ports: {item.ports}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  )
}
