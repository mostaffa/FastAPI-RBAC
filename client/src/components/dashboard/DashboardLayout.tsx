import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"
import Toolbar from "@mui/material/Toolbar"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useCallback, useRef, useState } from "react"
import { Outlet } from "react-router"
import DashboardHeader from "./header/DashboardHeader"
import DashboardSidebar from "./sidebar/DashboardSidebar"

export default function DashboardLayout() {
  const theme = useTheme()
  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    useState(true)
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    useState(false)
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"))
  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded
  const setIsNavigationExpanded = useCallback(
    (newExpanded: boolean) => {
      if (isOverMdViewport) {
        setIsDesktopNavigationExpanded(newExpanded)
      } else {
        setIsMobileNavigationExpanded(newExpanded)
      }
    },
    [
      isOverMdViewport,
      setIsDesktopNavigationExpanded,
      setIsMobileNavigationExpanded,
    ],
  )

  const handleToggleHeaderMenu = useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded)
    },
    [setIsNavigationExpanded],
  )

  const layoutRef = useRef<HTMLDivElement>(null)

  return (
    <Box
      ref={layoutRef}
      sx={{
        position: "relative",
        display: "flex",
        overflow: "hidden",
        height: "100vh",
        width: "100%",
      }}
    >
      <DashboardHeader
        title=""
        menuOpen={isNavigationExpanded}
        onToggleMenu={handleToggleHeaderMenu}
      />
      <DashboardSidebar
        expanded={isNavigationExpanded}
        setExpanded={setIsNavigationExpanded}
        container={layoutRef.current ?? undefined}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ displayPrint: "none" }} />
        <Box
          component="main"
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
