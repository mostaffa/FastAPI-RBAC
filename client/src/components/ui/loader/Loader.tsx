import CircularProgress from "@mui/material/CircularProgress"
import Box from "@mui/material/Box"
export type LoaderProps = {
  size?: number
  thickness?: number
  color?:
    | "primary"
    | "secondary"
    | "inherit"
    | "success"
    | "error"
    | "info"
    | "warning"
}
export default function Loader({
  size = 40,
  thickness = 3.6,
  color = "primary",
}: LoaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100%"
    >
      <CircularProgress size={size} thickness={thickness} color={color} />
    </Box>
  )
}
