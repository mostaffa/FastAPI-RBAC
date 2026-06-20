import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"
import Toolbar from "@mui/material/Toolbar"
import useMediaQuery from "@mui/material/useMediaQuery"
import { lazy, Suspense, useCallback, useRef, useState } from "react"

const Loader = lazy(() => import("@/components/ui/loader/Loader"))
const DashboardHeader = lazy(
  () => import("@/components/dashboard/header/DashboardHeader"),
)
const DashboardSidebar = lazy(
  () => import("@/components/dashboard/sidebar/DashboardSidebar"),
)
const DashboardRouter = lazy(() => import("@/routers/DashboardRouter"))

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
      <Suspense>
        <DashboardHeader
          title="WP100"
          menuOpen={isNavigationExpanded}
          onToggleMenu={handleToggleHeaderMenu}
        />
      </Suspense>
      <Suspense>
        <DashboardSidebar
          expanded={isNavigationExpanded}
          setExpanded={setIsNavigationExpanded}
          container={layoutRef.current ?? undefined}
        />
      </Suspense>
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
            // backgroundColor: theme.vars.palette.background.default,
          }}
        >
          <Suspense fallback={<Loader />}>
            <DashboardRouter />
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}
