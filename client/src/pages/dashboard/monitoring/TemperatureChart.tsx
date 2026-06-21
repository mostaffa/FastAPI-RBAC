import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"
import { useState } from "react"

export type TemperatureDataPoint = {
  time: string
  current: number
  high: number | null
  critical: number | null
}

type Props = {
  data: TemperatureDataPoint[]
}

function chartPointY(
  value: number,
  domainMin: number,
  domainMax: number,
  height: number,
): number {
  if (domainMax <= domainMin) return height
  const normalized = (value - domainMin) / (domainMax - domainMin)
  const clamped = Math.min(Math.max(normalized, 0), 1)
  return height - clamped * height
}

function createLinePath(
  data: TemperatureDataPoint[],
  width: number,
  height: number,
  domainMin: number,
  domainMax: number,
): string {
  if (data.length === 0) return ""

  if (data.length === 1) {
    const y = chartPointY(data[0].current, domainMin, domainMax, height)
    return `M 0 ${y.toFixed(2)} L ${width.toFixed(2)} ${y.toFixed(2)}`
  }

  return data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = chartPointY(point.current, domainMin, domainMax, height)
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function createAreaPath(
  data: TemperatureDataPoint[],
  width: number,
  height: number,
  domainMin: number,
  domainMax: number,
): string {
  const linePath = createLinePath(data, width, height, domainMin, domainMax)
  if (!linePath) return ""

  return `${linePath} L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`
}

export default function TemperatureChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const theme = useTheme()

  const latest = data.length > 0 ? data[data.length - 1] : null
  const current = latest?.current ?? 0
  const high = latest?.high ?? null
  const critical = latest?.critical ?? null

  const strokeColor =
    critical !== null && current >= critical
      ? theme.palette.error.main
      : high !== null && current >= high
        ? theme.palette.warning.main
        : theme.palette.info.main

  const currentValues = data
    .map(point => point.current)
    .filter(value => Number.isFinite(value))
  const minCurrent = currentValues.length > 0 ? Math.min(...currentValues) : 0
  const maxCurrent = currentValues.length > 0 ? Math.max(...currentValues) : 0
  const thresholdValues = data
    .flatMap(point => [point.high, point.critical])
    .filter(
      (value): value is number => value !== null && Number.isFinite(value),
    )
    .filter(value => value > 0)

  const allValues = [...currentValues, ...thresholdValues]
  const minDataValue = allValues.length > 0 ? Math.min(...allValues) : 0
  const maxDataValue = allValues.length > 0 ? Math.max(...allValues) : 50

  let yMin = Math.max(0, Math.floor((minDataValue - 5) / 5) * 5)
  let yMax = Math.ceil((maxDataValue + 5) / 5) * 5

  // Keep a readable spread even when values are tightly clustered.
  if (yMax - yMin < 20) {
    const center = (yMax + yMin) / 2
    yMin = Math.max(0, Math.floor((center - 10) / 5) * 5)
    yMax = Math.ceil((center + 10) / 5) * 5
  }

  const chartWidth = 720
  const chartHeight = 240
  const startLabel = data.length > 0 ? data[0].time : "--:--:--"
  const endLabel = data.length > 0 ? data[data.length - 1].time : "--:--:--"
  const linePath = createLinePath(data, chartWidth, chartHeight, yMin, yMax)
  const areaPath = createAreaPath(data, chartWidth, chartHeight, yMin, yMax)
  const hoveredPoint =
    hoveredIndex !== null && hoveredIndex >= 0 ? data[hoveredIndex] : null
  const hoverX =
    hoveredIndex !== null && data.length > 1
      ? (hoveredIndex / (data.length - 1)) * chartWidth
      : 0
  const hoverY = hoveredPoint
    ? chartPointY(hoveredPoint.current, yMin, yMax, chartHeight)
    : 0
  const hoverLeftPercent = (hoverX / chartWidth) * 100

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Last {data.length} readings (1 s interval)
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 1 }}
      >
        <Chip size="small" label={`Current ${current.toFixed(1)}°C`} />
        <Chip
          size="small"
          label={`Range ${minCurrent.toFixed(1)}-${maxCurrent.toFixed(1)}°C`}
          variant="outlined"
        />
        {high !== null ? (
          <Chip
            size="small"
            label={`High ${high.toFixed(1)}°C`}
            color="warning"
            variant="outlined"
          />
        ) : null}
        {critical !== null ? (
          <Chip
            size="small"
            label={`Critical ${critical.toFixed(1)}°C`}
            color="error"
            variant="outlined"
          />
        ) : null}
      </Stack>
      <Box
        sx={{ position: "relative", width: "100%", height: chartHeight }}
        onMouseMove={event => {
          if (data.length === 0) return
          const rect = event.currentTarget.getBoundingClientRect()
          const relativeX = event.clientX - rect.left
          const ratio = Math.min(Math.max(relativeX / rect.width, 0), 1)
          const index = Math.round(ratio * (data.length - 1))
          setHoveredIndex(index)
        }}
        onMouseLeave={() => {
          setHoveredIndex(null)
        }}
      >
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${String(chartWidth)} ${String(chartHeight)}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Temperature chart"
        >
          <defs>
            <linearGradient
              id="temperatureAreaGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="95%" stopColor={strokeColor} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map(step => {
            const value = yMin + (yMax - yMin) * step
            const y = chartPointY(value, yMin, yMax, chartHeight)
            return (
              <line
                key={step}
                x1="0"
                x2={String(chartWidth)}
                y1={y.toFixed(2)}
                y2={y.toFixed(2)}
                stroke={theme.palette.divider}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )
          })}

          {high !== null ? (
            <>
              <line
                x1="0"
                x2={String(chartWidth)}
                y1={chartPointY(high, yMin, yMax, chartHeight).toFixed(2)}
                y2={chartPointY(high, yMin, yMax, chartHeight).toFixed(2)}
                stroke={theme.palette.warning.main}
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              <text
                x="8"
                y={String(
                  Math.max(12, chartPointY(high, yMin, yMax, chartHeight) - 4),
                )}
                fill={theme.palette.warning.main}
                fontSize="11"
              >
                High
              </text>
            </>
          ) : null}

          {critical !== null ? (
            <>
              <line
                x1="0"
                x2={String(chartWidth)}
                y1={chartPointY(critical, yMin, yMax, chartHeight).toFixed(2)}
                y2={chartPointY(critical, yMin, yMax, chartHeight).toFixed(2)}
                stroke={theme.palette.error.main}
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              <text
                x="8"
                y={String(
                  Math.max(
                    12,
                    chartPointY(critical, yMin, yMax, chartHeight) - 4,
                  ),
                )}
                fill={theme.palette.error.main}
                fontSize="11"
              >
                Critical
              </text>
            </>
          ) : null}

          {areaPath ? (
            <path
              d={areaPath}
              fill="url(#temperatureAreaGradient)"
              stroke="none"
            />
          ) : null}

          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {hoveredPoint ? (
            <>
              <line
                x1={hoverX.toFixed(2)}
                x2={hoverX.toFixed(2)}
                y1="0"
                y2={String(chartHeight)}
                stroke={theme.palette.text.secondary}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <circle
                cx={hoverX.toFixed(2)}
                cy={hoverY.toFixed(2)}
                r="4"
                fill={strokeColor}
                stroke={theme.palette.background.paper}
                strokeWidth="2"
              />
            </>
          ) : null}

          <text x="8" y="12" fill={theme.palette.text.secondary} fontSize="11">
            {`${yMax.toFixed(0)}°C`}
          </text>
          <text
            x="8"
            y={String(chartHeight - 6)}
            fill={theme.palette.text.secondary}
            fontSize="11"
          >
            {`${yMin.toFixed(0)}°C`}
          </text>
          <text
            x="8"
            y={String(chartHeight - 20)}
            fill={theme.palette.text.secondary}
            fontSize="10"
          >
            {startLabel}
          </text>
          <text
            x={String(chartWidth - 8)}
            y={String(chartHeight - 20)}
            fill={theme.palette.text.secondary}
            fontSize="10"
            textAnchor="end"
          >
            {endLabel}
          </text>
        </svg>
        {hoveredPoint ? (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: `${String(hoverLeftPercent)}%`,
              transform:
                hoverLeftPercent > 65 ? "translateX(-100%)" : "translateX(8px)",
              bgcolor: "background.paper",
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              px: 1,
              py: 0.5,
              boxShadow: 2,
              pointerEvents: "none",
            }}
          >
            <Typography variant="caption" display="block">
              {hoveredPoint.time}
            </Typography>
            <Typography variant="caption" fontWeight={700} display="block">
              {hoveredPoint.current.toFixed(1)}°C
            </Typography>
            {hoveredPoint.high !== null ? (
              <Typography
                variant="caption"
                display="block"
                color="warning.main"
              >
                High {hoveredPoint.high.toFixed(1)}°C
              </Typography>
            ) : null}
            {hoveredPoint.critical !== null ? (
              <Typography variant="caption" display="block" color="error.main">
                Critical {hoveredPoint.critical.toFixed(1)}°C
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Current: {current.toFixed(1)}°C
      </Typography>
    </Box>
  )
}
