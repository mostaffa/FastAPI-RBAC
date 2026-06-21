import DashboardSidebarContext from "@/context/DashboardSidebarContext"
import Divider from "@mui/material/Divider"
import type {} from "@mui/material/themeCssVarsAugmentation"
import { useContext } from "react"
import { getDrawerSxTransitionMixin } from "../../mixins"

export default function DashboardSidebarDividerItem() {
  const sidebarContext = useContext(DashboardSidebarContext)
  if (!sidebarContext) {
    throw new Error("Sidebar context was used without a provider.")
  }
  const { fullyExpanded, hasDrawerTransitions } = sidebarContext

  return (
    <li>
      <Divider
        sx={{
          borderBottomWidth: 1,
          my: 1,
          mx: -0.5,
          ...(hasDrawerTransitions
            ? getDrawerSxTransitionMixin(fullyExpanded, "margin")
            : {}),
        }}
      />
    </li>
  )
}
