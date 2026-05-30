import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useTheme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"

export type CpuDataPoint = {
  time: string
  percent: number
}

type Props = {
  data: CpuDataPoint[]
}

function gradientColor(percent: number): string {
  if (percent >= 90) return "#c62828"
  if (percent >= 75) return "#ef6c00"
  if (percent >= 50) return "#f9a825"
  return "#1565c0"
}

export default function CpuChart({ data }: Props) {
  const theme = useTheme()
  const latest = data.length > 0 ? data[data.length - 1].percent : 0
  const strokeColor = gradientColor(latest)

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Last {data.length} readings (1 s interval)
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
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
            domain={[0, 100]}
            tickFormatter={value => String(value) + "%"}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
              fontSize: 13,
            }}
            formatter={value => {
              const numericValue =
                typeof value === "number" ? value : Number(value)
              return [numericValue.toFixed(1) + "%", "CPU"]
            }}
            labelFormatter={label => "Time: " + String(label)}
          />
          <Area
            type="monotone"
            dataKey="percent"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#cpuGradient)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
