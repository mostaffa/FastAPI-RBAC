import DashboardSidebarContext from "@/context/DashboardSidebarContext"
import { useAuth } from "@/hooks/useAuth/useAuth.ts"
import { BASE_URL, DASHBOARD_URL } from "@/utils/constants.ts"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import ComputerIcon from "@mui/icons-material/Computer"
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard"
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import GroupsIcon from "@mui/icons-material/Groups"
import MemoryIcon from "@mui/icons-material/Memory"
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices"
import MonitorIcon from "@mui/icons-material/Monitor"
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline"
import PersonIcon from "@mui/icons-material/Person"
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred"
import StorageIcon from "@mui/icons-material/Storage"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import List from "@mui/material/List"
import Toolbar from "@mui/material/Toolbar"
import { useTheme } from "@mui/material/styles"
import type {} from "@mui/material/themeCssVarsAugmentation"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useCallback, useEffect, useMemo, useState } from "react"
import { matchPath, useLocation } from "react-router"
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../constants.ts"
import {
  getDrawerSxTransitionMixin,
  getDrawerWidthTransitionMixin,
} from "../mixins"
import DashboardSidebarDividerItem from "./deviderItem/DashboardSidebarDividerItem"
import DashboardSidebarHeaderItem from "./headerItem/DashboardSidebarHeaderItem.tsx"
import DashboardSidebarPageItem from "./headerPageItem/DashboardSidebarPageItem.tsx"

export type DashboardSidebarProps = {
  readonly expanded?: boolean
  readonly setExpanded: (expanded: boolean) => void
  readonly disableCollapsibleSidebar?: boolean
  readonly container?: Element
}

export default function DashboardSidebar({
  expanded = true,
  setExpanded,
  disableCollapsibleSidebar = false,
  container,
}: DashboardSidebarProps) {
  const { logout, user, getPermissions } = useAuth()
  const permissions = useMemo(() => getPermissions ?? [], [getPermissions])
  const theme = useTheme()
  const { pathname } = useLocation()
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([])
  const isOverSmViewport = useMediaQuery(theme.breakpoints.up("sm"))
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"))
  const [isFullyExpanded, setIsFullyExpanded] = useState(expanded)
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(!expanded)

  useEffect(() => {
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

  useEffect(() => {
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

  const handleSetSidebarExpanded = useCallback(
    (newExpanded: boolean) => () => {
      setExpanded(newExpanded)
    },
    [setExpanded],
  )

  const handlePageItemClick = useCallback(
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

  const getDrawerContent = useCallback(
    (viewport: "phone" | "tablet" | "desktop") => (
      <>
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
              href={`${BASE_URL}${DASHBOARD_URL}me`}
              selected={
                !!matchPath(
                  { path: `${BASE_URL}${DASHBOARD_URL}me/*` },
                  pathname,
                ) || pathname === `${BASE_URL}${DASHBOARD_URL}me`
              }
            />
            <DashboardSidebarDividerItem />
            {(permissions.includes("role:read") ||
              permissions.includes("user:read") ||
              permissions.includes("permission:read")) && (
              <>
                <DashboardSidebarHeaderItem>Admin</DashboardSidebarHeaderItem>
                <DashboardSidebarPageItem
                  id="administration"
                  title="Administration"
                  icon={<AdminPanelSettingsIcon />}
                  selected={
                    !!matchPath(
                      { path: `${BASE_URL}${DASHBOARD_URL}admin/*` },
                      pathname,
                    )
                  }
                  defaultExpanded={
                    !!matchPath(
                      { path: `${BASE_URL}${DASHBOARD_URL}admin/` },
                      pathname,
                    )
                  }
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
                          href={`${BASE_URL}${DASHBOARD_URL}admin/roles/`}
                          selected={
                            !!matchPath(
                              {
                                path: `${BASE_URL}${DASHBOARD_URL}admin/roles/`,
                              },
                              pathname,
                            )
                          }
                        />
                      )}
                      {permissions.includes("user:read") && (
                        <DashboardSidebarPageItem
                          id="allUsers"
                          title="Users"
                          icon={<PeopleOutlineIcon />}
                          href={`${BASE_URL}${DASHBOARD_URL}admin/users/`}
                          selected={
                            !!matchPath(
                              {
                                path: `${BASE_URL}${DASHBOARD_URL}admin/users/`,
                              },
                              pathname,
                            )
                          }
                        />
                      )}
                      {permissions.includes("permission:read") && (
                        <DashboardSidebarPageItem
                          id="allPermissions"
                          title="Permissions"
                          icon={<ReportGmailerrorredIcon />}
                          href={`${BASE_URL}${DASHBOARD_URL}admin/permissions/`}
                          selected={
                            !!matchPath(
                              {
                                path: `${BASE_URL}${DASHBOARD_URL}admin/permissions/*`,
                              },
                              pathname,
                            )
                          }
                        />
                      )}
                    </List>
                  }
                />

                <DashboardSidebarDividerItem />
              </>
            )}
            {permissions.includes("sensors:read") && (
              <>
                <DashboardSidebarHeaderItem>
                  Monitoring
                </DashboardSidebarHeaderItem>
                <DashboardSidebarPageItem
                  id="monitoring"
                  title={"Monitoring"}
                  icon={<MonitorIcon />}
                  selected={
                    !!matchPath(`${BASE_URL}${DASHBOARD_URL}manage/*`, pathname)
                  }
                  defaultExpanded={
                    !!matchPath(`${BASE_URL}${DASHBOARD_URL}manage/`, pathname)
                  }
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
                      {permissions.includes("sensors:read") && (
                        <>
                          <DashboardSidebarPageItem
                            id={"system"}
                            title={"System"}
                            icon={<ComputerIcon />}
                            href={`${BASE_URL}${DASHBOARD_URL}manage/system/`}
                            selected={
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/system/`,
                                },
                                pathname,
                              ) ||
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/system/`,
                                },
                                pathname,
                              )
                            }
                          />
                          <DashboardSidebarPageItem
                            id={"temperature"}
                            title={"Temperature"}
                            icon={<DeviceThermostatIcon />}
                            href={`${BASE_URL}${DASHBOARD_URL}manage/temperature/`}
                            selected={
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/temperature/`,
                                },
                                pathname,
                              ) ||
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/temperature/`,
                                },
                                pathname,
                              )
                            }
                          />
                          <DashboardSidebarPageItem
                            id={"memory"}
                            title={"Memory"}
                            icon={<MemoryIcon />}
                            href={`${BASE_URL}${DASHBOARD_URL}manage/memory/`}
                            selected={
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/memory/`,
                                },
                                pathname,
                              ) ||
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/memory/`,
                                },
                                pathname,
                              )
                            }
                          />
                          <DashboardSidebarPageItem
                            id={"cpu"}
                            title={"CPU"}
                            icon={<DeveloperBoardIcon />}
                            href={`${BASE_URL}${DASHBOARD_URL}manage/cpu/`}
                            selected={
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/cpu/`,
                                },
                                pathname,
                              ) ||
                              !!matchPath(
                                {
                                  path: `${BASE_URL}${DASHBOARD_URL}manage/cpu/`,
                                },
                                pathname,
                              )
                            }
                          />
                          <DashboardSidebarPageItem
                            id={"disk"}
                            title={"Disk"}
                            icon={<StorageIcon />}
                            href={`${BASE_URL}${DASHBOARD_URL}manage/disk/`}
                            selected={
                              !!matchPath(
                                `${BASE_URL}${DASHBOARD_URL}manage/disk/`,
                                pathname,
                              )
                            }
                          />
                        </>
                      )}
                    </List>
                  }
                ></DashboardSidebarPageItem>
                <DashboardSidebarDividerItem />
              </>
            )}
            {permissions.includes("services:read") && (
              <>
                <DashboardSidebarHeaderItem>
                  Services
                </DashboardSidebarHeaderItem>
                <DashboardSidebarPageItem
                  id="services"
                  title="Services"
                  icon={<MiscellaneousServicesIcon />}
                  href={`${BASE_URL}${DASHBOARD_URL}services/`}
                  selected={
                    !!matchPath(
                      `${BASE_URL}${DASHBOARD_URL}services/`,
                      pathname,
                    ) ||
                    !!matchPath(
                      `${BASE_URL}${DASHBOARD_URL}services/`,
                      pathname,
                    )
                  }
                />
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
      </>
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
    ],
  )

  const getDrawerSharedSx = useCallback(
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

  const sidebarContextValue = useMemo(() => {
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
