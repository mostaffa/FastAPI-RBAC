import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"
import { useState } from "react"
import { usageColor } from "./usageColor"

export type MemoryDataPoint = {
  time: string
  percent: number
}

type Props = {
  data: MemoryDataPoint[]
}

function chartPointY(percent: number, height: number): number {
  const normalized = Math.min(Math.max(percent, 0), 100) / 100
  return height - normalized * height
}

function createLinePath(
  data: MemoryDataPoint[],
  width: number,
  height: number,
): string {
  if (data.length === 0) return ""

  if (data.length === 1) {
    const y = chartPointY(data[0].percent, height)
    return `M 0 ${y.toFixed(2)} L ${width.toFixed(2)} ${y.toFixed(2)}`
  }

  return data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = chartPointY(point.percent, height)
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function createAreaPath(
  data: MemoryDataPoint[],
  width: number,
  height: number,
): string {
  const linePath = createLinePath(data, width, height)
  if (!linePath) return ""

  return `${linePath} L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`
}

export default function MemoryChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const theme = useTheme()
  const latest = data.length > 0 ? data[data.length - 1].percent : 0
  const min =
    data.length > 0 ? Math.min(...data.map(point => point.percent)) : 0
  const max =
    data.length > 0 ? Math.max(...data.map(point => point.percent)) : 0
  const startLabel = data.length > 0 ? data[0].time : "--:--:--"
  const endLabel = data.length > 0 ? data[data.length - 1].time : "--:--:--"
  const strokeColor = usageColor(theme, latest)
  const chartWidth = 720
  const chartHeight = 220
  const linePath = createLinePath(data, chartWidth, chartHeight)
  const areaPath = createAreaPath(data, chartWidth, chartHeight)
  const hoveredPoint =
    hoveredIndex !== null && hoveredIndex >= 0 ? data[hoveredIndex] : null
  const hoverX =
    hoveredIndex !== null && data.length > 1
      ? (hoveredIndex / (data.length - 1)) * chartWidth
      : 0
  const hoverY = hoveredPoint
    ? chartPointY(hoveredPoint.percent, chartHeight)
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
        <Chip size="small" label={`Current ${latest.toFixed(1)}%`} />
        <Chip
          size="small"
          label={`Min ${min.toFixed(1)}%`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Max ${max.toFixed(1)}%`}
          variant="outlined"
        />
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
          aria-label="Memory usage chart"
        >
          <defs>
            <linearGradient id="memoryAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="95%" stopColor={strokeColor} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map(percent => {
            const y = chartPointY(percent, chartHeight)
            return (
              <line
                key={percent}
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

          {areaPath ? (
            <path d={areaPath} fill="url(#memoryAreaGradient)" stroke="none" />
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
            100%
          </text>
          <text
            x="8"
            y={String(chartHeight - 6)}
            fill={theme.palette.text.secondary}
            fontSize="11"
          >
            0%
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
                hoverLeftPercent > 70 ? "translateX(-100%)" : "translateX(8px)",
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
            <Typography variant="caption" fontWeight={700}>
              {hoveredPoint.percent.toFixed(1)}%
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Current: {latest.toFixed(1)}%
      </Typography>
    </Box>
  )
}
