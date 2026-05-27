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
