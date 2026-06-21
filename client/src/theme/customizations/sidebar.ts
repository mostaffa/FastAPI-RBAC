import { listItemButtonClasses } from "@mui/material/ListItemButton"
import { listSubheaderClasses } from "@mui/material/ListSubheader"
import type { Components, Theme } from "@mui/material/styles"
import { typographyClasses } from "@mui/material/Typography"

export const sidebarCustomizations: Components<Theme> = {
  MuiDrawer: {
    styleOverrides: {
      root: ({ theme }) => ({
        [`& .${listSubheaderClasses.root}`]: {
          lineHeight: 3,
        },
        [`& .${listItemButtonClasses.root}`]: {
          "&.Mui-selected": {
            [`& .${typographyClasses.root}`]: {
              color: theme.vars.palette.text.primary,
            },
          },
        },
      }),
    },
  },
}
