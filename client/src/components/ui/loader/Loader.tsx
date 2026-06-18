import { memo } from "react"
import { CircularProgress, Box } from "@mui/material"

// Memoize the loader component to prevent unnecessary re-renders
export const Loader = memo(() => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
))

export default Loader
