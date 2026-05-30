import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

export type TemperatureDataPoint = {
  time: string
  current: number
  high: number | null
  critical: number | null
}

type Props = {
  data: TemperatureDataPoint[]
}

export default function TemperatureChart({ data }: Props) {
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
  const thresholdValues = data
    .flatMap(point => [point.high, point.critical])
    .filter((value): value is number => value !== null && Number.isFinite(value))
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

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Last {data.length} readings (1 s interval)
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={v => `${v}°C`}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          {high !== null ? (
            <ReferenceLine
              y={high}
              stroke={theme.palette.warning.main}
              strokeDasharray="4 4"
              label={{ value: "High", fill: theme.palette.warning.main, fontSize: 11 }}
            />
          ) : null}
          {critical !== null ? (
            <ReferenceLine
              y={critical}
              stroke={theme.palette.error.main}
              strokeDasharray="4 4"
              label={{
                value: "Critical",
                fill: theme.palette.error.main,
                fontSize: 11,
              }}
            />
          ) : null}
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              fontSize: 13,
            }}
            formatter={(value: number, name: string) => {
              if (name === "current") return [`${value.toFixed(1)}°C`, "Current"]
              return [String(value), name]
            }}
            labelFormatter={label => `Time: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#temperatureGradient)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
