import * as React from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import type { ThemeOptions } from "@mui/material/styles"
import { alpha } from "@mui/material/styles"
import {
  dataGridCustomizations,
  datePickersCustomizations,
  formInputCustomizations,
  navigationCustomizations,
  sidebarCustomizations,
} from "./customizations"
import { colorSchemes, typography, shadows, shape } from "./themePrimitives"

type AppThemeProps = {
  children: React.ReactNode
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme?: boolean
  themeComponents?: ThemeOptions["components"]
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme, themeComponents } = props
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
          // For more details about CSS variables configuration, see https://mui.com/material-ui/customization/css-theme-variables/configuration/
          cssVariables: {
            colorSchemeSelector: "data-mui-color-scheme",
            cssVarPrefix: "template",
          },
          colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
          typography,
          shadows,
          shape,
          components: {
            ...dataGridCustomizations,
            ...datePickersCustomizations,
            ...formInputCustomizations,
            ...navigationCustomizations,
            ...sidebarCustomizations,
            MuiCssBaseline: {
              styleOverrides: theme => ({
                body: {
                  backgroundImage: `radial-gradient(circle at 20% -10%, rgba(${theme.vars.palette.primary.mainChannel} / ${theme.palette.mode === "light" ? "0.12" : "0.2"}), transparent 15%), radial-gradient(circle at 90% 0%, rgba(${theme.vars.palette.secondary.mainChannel} / ${theme.palette.mode === "light" ? "0.31" : "0.16"}), transparent 70%), linear-gradient(180deg, ${theme.vars.palette.background.default} 100%, ${theme.vars.palette.background.paper} 10%)`,
                  backgroundAttachment: "fixed",
                },
              }),
            },
            MuiPaper: {
              styleOverrides: {
                root: ({ theme }) => ({
                  // backgroundImage: "none",
                  // backgroundColor: `${alpha(theme.palette.background.paper, 0.1)}`,
                  // background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                  border: `2px solid ${alpha(theme.palette.divider, 0.5)}`,
                  borderRadius: 6,
                }),
              },
            },
            MuiCard: {
              styleOverrides: {
                root: ({ theme }) => ({
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: theme.shadows[1],
                }),
              },
            },
            MuiAppBar: {
              styleOverrides: {
                root: ({ theme }) => ({
                  borderBottom: `1px solid ${theme.vars.palette.divider}`,
                  backgroundImage: "none",
                  color: theme.vars.palette.text.primary,
                  backgroundColor: theme.vars.palette.background.paper,
                  backdropFilter: "blur(4px)",
                }),
              },
            },
            MuiOutlinedInput: {
              styleOverrides: {
                root: ({ theme }) => ({
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: alpha(theme.palette.background.paper, 0.2),
                }),
              },
            },
            MuiButton: {
              defaultProps: {
                disableElevation: true,
              },
              styleOverrides: {
                root: {
                  textTransform: "none",
                  fontWeight: 600,
                },
                containedPrimary: ({ theme }) => ({
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                  color: "rgb(255, 255, 255)",
                }),
              },
            },
            MuiChip: {
              styleOverrides: {
                root: ({ theme }) => ({
                  borderRadius: theme.shape.borderRadius,
                }),
              },
            },
            MuiTooltip: {
              styleOverrides: {
                tooltip: ({ theme }) => ({
                  borderRadius: theme.shape.borderRadius,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }),
              },
            },
            MuiDialog: {
              styleOverrides: {
                paper: ({ theme }) => ({
                  borderRadius: theme.shape.borderRadius,
                }),
                backdrop: () => ({
                  backgroundImage: "none",
                  backgroundColor: "rgba(0, 0, 0, 0.32)",
                  backdropFilter: "blur(2px)",
                }),
              },
            },
            ...themeComponents,
          },
        })
  }, [disableCustomTheme, themeComponents])
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>
  }
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
