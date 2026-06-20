import DashboardSidebarContext from "@/context/DashboardSidebarContext"
import ListSubheader from "@mui/material/ListSubheader"
import type {} from "@mui/material/themeCssVarsAugmentation"
import { useContext } from "react"
import { DRAWER_WIDTH } from "../../constants"
import { getDrawerSxTransitionMixin } from "../../mixins"

export type DashboardSidebarHeaderItemProps = {
  children?: React.ReactNode
}

export default function DashboardSidebarHeaderItem({
  children,
}: DashboardSidebarHeaderItemProps) {
  const sidebarContext = useContext(DashboardSidebarContext)
  if (!sidebarContext) {
    throw new Error("Sidebar context was used without a provider.")
  }
  const { mini, fullyExpanded, hasDrawerTransitions } = sidebarContext

  return (
    <ListSubheader
      sx={{
        fontSize: 12,
        fontWeight: "600",
        height: mini ? 0 : 36,
        ...(hasDrawerTransitions
          ? getDrawerSxTransitionMixin(fullyExpanded, "height")
          : {}),
        px: 1.5,
        py: 0,
        minWidth: DRAWER_WIDTH,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        zIndex: 2,
      }}
    >
      {children}
    </ListSubheader>
  )
}
