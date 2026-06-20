import { Box, CircularProgress } from "@mui/material"
import { memo } from "react"

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
