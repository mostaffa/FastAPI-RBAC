import * as React from "react"
import { useTheme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import Box from "@mui/material/Box"
import Toolbar from "@mui/material/Toolbar"
import DashboardHeader from "../../components/dashboard/header/DashboardHeader"
import DashboardSidebar from "../../components/dashboard/sidebar/DashboardSidebar"
import Loader from "../../components/ui/loader/Loader"
// import logo from "../../logo.svg"

const DashboardRouter = React.lazy(
  () => import("../../routers/DashboardRouter"),
)

export default function DashboardLayout() {
  const theme = useTheme()

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(true)
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    React.useState(false)

  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"))

  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded

  const setIsNavigationExpanded = React.useCallback(
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

  const handleToggleHeaderMenu = React.useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded)
    },
    [setIsNavigationExpanded],
  )

  const layoutRef = React.useRef<HTMLDivElement>(null)

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
        // logo={<Box component="img" src={LogoDark} alt="Logo" sx={{height: 32}} />}
        // logo={
        //   <img
        //     // component={"img"}
        //     src={logo}
        //     alt="Logo"
        //     width="100%"
        //     height="32"
        //   />
        // }
        title="RF24"
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
          <React.Suspense fallback={<Loader />}>
            <DashboardRouter />
          </React.Suspense>
        </Box>
      </Box>
    </Box>
  )
}
