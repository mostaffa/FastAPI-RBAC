import type { Theme } from "@mui/material/styles"

export function usageColor(theme: Theme, percent: number): string {
  if (percent >= 90) return theme.palette.error.main
  if (percent >= 75) return theme.palette.warning.main
  if (percent >= 50) return theme.palette.warning.light
  return theme.palette.info.main
}
