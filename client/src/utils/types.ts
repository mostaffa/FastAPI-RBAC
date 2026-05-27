export type TemperatureReading = [
  label: string,
  current: number,
  high: number | null,
  critical: number | null,
]

export type SensorsTemperaturesData = Record<string, TemperatureReading[]>

export type SensorsTemperaturesResponse = {
  data: SensorsTemperaturesData
}

export type MemoryStats = {
  total: number
  available: number
  percent: number
  used: number
  free: number
  active: number
  inactive: number
  buffers: number
  cached: number
  shared: number
  slab: number
}

export type MemoryRealtimeResponse = {
  data: MemoryStats
}

export type CpuStats = {
  percent: number
  count_logical: number
  count_physical: number | null
  freq_current: number | null
  freq_min: number | null
  freq_max: number | null
}

export type CpuRealtimeResponse = {
  data: CpuStats
}

export type DiskStats = {
  path: string
  total: number
  used: number
  free: number
  percent: number
}

export type DiskRealtimeResponse = {
  data: DiskStats
}
