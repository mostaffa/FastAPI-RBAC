import * as React from "react"
import { useTheme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import { selectSensors } from "../../../features/sensors/sensorsSlice.ts"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import List from "@mui/material/List"
import Toolbar from "@mui/material/Toolbar"
import type {} from "@mui/material/themeCssVarsAugmentation"
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import { matchPath, useLocation } from "react-router"
import DashboardSidebarContext from "../../../context/DashboardSidebarContext"
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../constants.ts"
import DashboardSidebarPageItem from "./headerPageItem/DashboardSidebarPageItem.tsx"
import DashboardSidebarHeaderItem from "./headerItem/DashboardSidebarHeaderItem.tsx"
import DashboardSidebarDividerItem from "./deviderItem/DashboardSidebarDividerItem"
import PersonIcon from "@mui/icons-material/Person"
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline"
import GroupsIcon from "@mui/icons-material/Groups"
import SensorsIcon from "@mui/icons-material/Sensors"
import SettingsIcon from "@mui/icons-material/Settings"
import TerminalIcon from "@mui/icons-material/Terminal"
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat"
import MonitorIcon from "@mui/icons-material/Monitor"
import ComputerIcon from "@mui/icons-material/Computer"
import MemoryIcon from "@mui/icons-material/Memory"
import StorageIcon from "@mui/icons-material/Storage"
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard"
import {
  getDrawerSxTransitionMixin,
  getDrawerWidthTransitionMixin,
} from "../mixins"
import { useAppSelector } from "../../../app/hooks.ts"

import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import { useAuth } from "@/hooks/useAuth/useAuth.ts"

export type DashboardSidebarProps = {
  expanded?: boolean
  setExpanded: (expanded: boolean) => void
  disableCollapsibleSidebar?: boolean
  container?: Element
}

export default function DashboardSidebar({
  expanded = true,
  setExpanded,
  disableCollapsibleSidebar = false,
  container,
}: DashboardSidebarProps) {
  const { logout, user, getPermissions } = useAuth()
  const permissions = React.useMemo(
    () => getPermissions ?? [],
    [getPermissions],
  )

  const theme = useTheme()

  const { pathname } = useLocation()

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([])

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up("sm"))
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"))

  const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded)
  const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded)

  const sensors = useAppSelector(selectSensors)

  React.useEffect(() => {
    if (expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyExpanded(true)
      }, theme.transitions.duration.enteringScreen)

      return () => {
        clearTimeout(drawerWidthTransitionTimeout)
      }
    }

    setIsFullyExpanded(false)
    return
  }, [expanded, theme.transitions.duration.enteringScreen])

  React.useEffect(() => {
    if (!expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyCollapsed(true)
      }, theme.transitions.duration.leavingScreen)

      return () => {
        clearTimeout(drawerWidthTransitionTimeout)
      }
    }

    setIsFullyCollapsed(false)
    // disable area-hidden when dialog is closed
    document.getElementById("root")?.setAttribute("aria-hidden", "false")
    return
  }, [expanded, theme.transitions.duration.leavingScreen])

  const mini = !disableCollapsibleSidebar && !expanded

  const handleSetSidebarExpanded = React.useCallback(
    (newExpanded: boolean) => () => {
      setExpanded(newExpanded)
    },
    [setExpanded],
  )

  const handlePageItemClick = React.useCallback(
    (itemId: string, hasNestedNavigation: boolean) => {
      if (hasNestedNavigation && !mini) {
        setExpandedItemIds(previousValue =>
          previousValue.includes(itemId)
            ? previousValue.filter(
                previousValueItemId => previousValueItemId !== itemId,
              )
            : [...previousValue, itemId],
        )
      } else if (!isOverSmViewport && !hasNestedNavigation) {
        setExpanded(false)
      }
    },
    [mini, setExpanded, isOverSmViewport],
  )

  const hasDrawerTransitions =
    isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport)

  const getDrawerContent = React.useCallback(
    (viewport: "phone" | "tablet" | "desktop") => (
      <React.Fragment>
        <Toolbar />
        <Box
          component="nav"
          aria-label={`${viewport.charAt(0).toUpperCase()}${viewport.slice(1)}`}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "auto",
            scrollbarGutter: mini ? "stable" : "auto",
            overflowX: "hidden",
            pt: !mini ? 0 : 2,
            ...(hasDrawerTransitions
              ? getDrawerSxTransitionMixin(isFullyExpanded, "padding")
              : {}),
          }}
        >
          <List
            dense
            sx={{
              padding: mini ? 0 : 0.5,
              mb: 4,
              width: mini ? MINI_DRAWER_WIDTH : "auto",
            }}
          >
            <DashboardSidebarHeaderItem>
              Profile Settings
            </DashboardSidebarHeaderItem>
            <DashboardSidebarPageItem
              id="me"
              title={
                user
                  ? user.user.first_name
                    ? user.user.first_name + " " + (user.user.last_name ?? "")
                    : user.user.username
                  : ""
              }
              icon={<PersonIcon />}
              href="/me"
              selected={!!matchPath("/me/*", pathname) || pathname === "/"}
            />
            <DashboardSidebarDividerItem />
            {/* <DashboardSidebarPageItem
              id="layout"
              title="Layout"
              icon={<ViewQuiltIcon />}
              href="/layout"
              selected={!!matchPath("/layout/*", pathname)}
            /> */}
            {(permissions.includes("role:read") ||
              permissions.includes("user:read") ||
              permissions.includes("permission:read")) && (
              <>
                <DashboardSidebarHeaderItem>Admin</DashboardSidebarHeaderItem>

                <DashboardSidebarPageItem
                  id="administration"
                  title="Administration"
                  icon={<AdminPanelSettingsIcon />}
                  selected={!!matchPath("/admin/*", pathname)}
                  defaultExpanded={!!matchPath("/admin/", pathname)}
                  expanded={expandedItemIds.includes("administration")}
                  nestedNavigation={
                    <List
                      dense
                      sx={{
                        padding: 0,
                        my: 1,
                        pl: mini ? 0 : 1,
                        minWidth: 240,
                      }}
                    >
                      {permissions.includes("role:read") && (
                        <DashboardSidebarPageItem
                          id="allRoles"
                          title="Roles"
                          icon={<GroupsIcon />}
                          href="/admin/roles"
                          selected={!!matchPath("/admin/roles", pathname)}
                        />
                      )}
                      {permissions.includes("user:read") && (
                        <DashboardSidebarPageItem
                          id="allUsers"
                          title="Users"
                          icon={<PeopleOutlineIcon />}
                          href="/admin/users"
                          selected={!!matchPath("/admin/users", pathname)}
                        />
                      )}
                      {permissions.includes("permission:read") && (
                        <DashboardSidebarPageItem
                          id="allPermissions"
                          title="Permissions"
                          icon={<ReportGmailerrorredIcon />}
                          href="/admin/permissions"
                          selected={
                            !!matchPath("/admin/permissions/*", pathname)
                          }
                        />
                      )}
                    </List>
                  }
                />

                <DashboardSidebarDividerItem />
              </>
            )}
            {permissions.includes("terminal:read") && (
              <>
                <DashboardSidebarHeaderItem>
                  Management
                </DashboardSidebarHeaderItem>
                <DashboardSidebarPageItem
                  id="manage"
                  title={"Management"}
                  icon={<SettingsIcon />}
                  selected={!!matchPath("/manage/*", pathname)}
                  defaultExpanded={!!matchPath("/manage/", pathname)}
                  expanded={expandedItemIds.includes("manage")}
                  nestedNavigation={
                    <List
                      dense
                      sx={{
                        padding: 0,
                        my: 1,
                        pl: mini ? 0 : 1,
                        minWidth: 240,
                      }}
                    >
                      <DashboardSidebarPageItem
                        id={"terminal"}
                        title={"Terminal"}
                        icon={<TerminalIcon />}
                        href={"/manage/terminal/"}
                        selected={!!matchPath("/manage/terminal/", pathname)}
                      />
                    </List>
                  }
                />
                <DashboardSidebarDividerItem />
              </>
            )}
            {permissions.includes("sensors:read") && (
              <>
                {sensors && (
                  <>
                    <DashboardSidebarHeaderItem>
                      Sensors
                    </DashboardSidebarHeaderItem>
                    <DashboardSidebarPageItem
                      id="sensors"
                      title={"Sensors (" + String(sensors.length) + ")"}
                      icon={<SensorsIcon />}
                      selected={!!matchPath("/sensors/*", pathname)}
                      defaultExpanded={!!matchPath("/sensors/", pathname)}
                      expanded={expandedItemIds.includes("sensors")}
                      nestedNavigation={
                        <List
                          dense
                          sx={{
                            padding: 0,
                            my: 1,
                            pl: mini ? 0 : 1,
                            minWidth: 240,
                          }}
                        >
                          {sensors.map((sensor, idx) => (
                            <DashboardSidebarPageItem
                              key={sensor + String(idx)}
                              id={sensor}
                              title={sensor}
                              icon={<SensorsIcon />}
                              href={"/sensors/" + sensor}
                              selected={
                                !!matchPath("/sensors/" + sensor, pathname)
                              }
                            />
                          ))}
                        </List>
                      }
                    />
                  </>
                )}
                <DashboardSidebarHeaderItem>
                  Monitoring
                </DashboardSidebarHeaderItem>
                <DashboardSidebarPageItem
                  id="monitoring"
                  title={"Monitoring"}
                  icon={<MonitorIcon />}
                  selected={!!matchPath("/monitoring/*", pathname)}
                  defaultExpanded={!!matchPath("/monitoring/", pathname)}
                  expanded={expandedItemIds.includes("monitoring")}
                  nestedNavigation={
                    <List
                      dense
                      sx={{
                        padding: 0,
                        my: 1,
                        pl: mini ? 0 : 1,
                        minWidth: 240,
                      }}
                    >
                      <DashboardSidebarPageItem
                        id={"system"}
                        title={"System"}
                        icon={<ComputerIcon />}
                        href={"/manage/system/"}
                        selected={
                          !!matchPath("/manage/system", pathname) ||
                          !!matchPath("/manage/system/", pathname)
                        }
                      />
                      <DashboardSidebarPageItem
                        id={"temperature"}
                        title={"Temperature"}
                        icon={<DeviceThermostatIcon />}
                        href={"/manage/temperature/"}
                        selected={!!matchPath("/manage/temperature/", pathname)}
                      />
                      <DashboardSidebarPageItem
                        id={"memory"}
                        title={"Memory"}
                        icon={<MemoryIcon />}
                        href={"/manage/memory/"}
                        selected={!!matchPath("/manage/memory/", pathname)}
                      />
                      <DashboardSidebarPageItem
                        id={"cpu"}
                        title={"CPU"}
                        icon={<DeveloperBoardIcon />}
                        href={"/manage/cpu/"}
                        selected={!!matchPath("/manage/cpu/", pathname)}
                      />
                      <DashboardSidebarPageItem
                        id={"disk"}
                        title={"Disk"}
                        icon={<StorageIcon />}
                        href={"/manage/disk/"}
                        selected={!!matchPath("/manage/disk/", pathname)}
                      />
                    </List>
                  }
                ></DashboardSidebarPageItem>
                {/* <DashboardSidebarPageItem
                id="sensors"
                title="Sensors"
                icon={<SensorsIcon />}
                href="/sensors"
                selected={!!matchPath("/sensors", pathname)}
              /> */}
                <DashboardSidebarDividerItem />
              </>
            )}
            <DashboardSidebarPageItem
              id="logout"
              title="Logout"
              icon={<ExitToAppIcon />}
              // href="/logout"
              onClick={() => {
                void (async () => {
                  await logout()
                })()
              }}
              selected={true}
            />
          </List>
        </Box>
      </React.Fragment>
    ),
    [
      mini,
      hasDrawerTransitions,
      isFullyExpanded,
      expandedItemIds,
      pathname,
      logout,
      user,
      permissions,
      sensors,
    ],
  )

  const getDrawerSharedSx = React.useCallback(
    (isTemporary: boolean) => {
      const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH

      return {
        displayPrint: "none",
        width: drawerWidth,
        flexShrink: 0,
        ...getDrawerWidthTransitionMixin(expanded),
        ...(isTemporary ? { position: "absolute" } : {}),
        [`& .MuiDrawer-paper`]: {
          position: "absolute",
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundImage: "none",
          ...getDrawerWidthTransitionMixin(expanded),
        },
      }
    },
    [expanded, mini],
  )

  const sidebarContextValue = React.useMemo(() => {
    return {
      onPageItemClick: handlePageItemClick,
      mini,
      fullyExpanded: isFullyExpanded,
      fullyCollapsed: isFullyCollapsed,
      hasDrawerTransitions,
    }
  }, [
    handlePageItemClick,
    mini,
    isFullyExpanded,
    isFullyCollapsed,
    hasDrawerTransitions,
  ])

  return (
    <DashboardSidebarContext.Provider value={sidebarContextValue}>
      <Drawer
        container={container}
        variant="temporary"
        open={expanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: {
            xs: "block",
            sm: disableCollapsibleSidebar ? "block" : "none",
            md: "none",
          },
          ...getDrawerSharedSx(true),
        }}
      >
        {getDrawerContent("phone")}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            sm: disableCollapsibleSidebar ? "none" : "block",
            md: "none",
          },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent("tablet")}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent("desktop")}
      </Drawer>
    </DashboardSidebarContext.Provider>
  )
}
