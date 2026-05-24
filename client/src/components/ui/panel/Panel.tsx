import React, { useState, useEffect } from "react"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import FilterNoneIcon from "@mui/icons-material/FilterNone"
import MinimizeIcon from "@mui/icons-material/Minimize"
import CropDinIcon from "@mui/icons-material/CropDin"
import { useTheme } from "@mui/material"
import Collapse from "@mui/material/Collapse"
import Typography from "@mui/material/Typography"
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import Paper from "@mui/material/Paper"

type SxProps<T extends object = Theme> =
  | SystemStyleObject<T>
  | ((theme: T) => SystemStyleObject<T>)
  | (
      | boolean
      | SystemStyleObject<T>
      | ((theme: T) => SystemStyleObject<T>)
      | null
      | undefined
    )[]

type PanelHeadersActionsType = (() => void) | null | undefined

type PanelProps = {
  component?: React.ReactNode
  sx?: SxProps
  theme?: Theme
  title?: React.ReactNode | string
  show?: boolean
  headersButtons?: boolean
  onCloseAction?: PanelHeadersActionsType
  onMaximizeAction?: PanelHeadersActionsType
  onMinimizeAction?: PanelHeadersActionsType
  collapsed?: boolean
  extraHeaderButtons?: React.ReactNode[]
}

export const Panel: React.FC<PanelProps> = ({
  component,
  sx,
  theme,
  title,
  headersButtons = true,
  onMaximizeAction,
  onMinimizeAction,
  onCloseAction,
  show = true,
  collapsed = false,
  extraHeaderButtons,
}) => {
  const muiTheme = useTheme()
  const _theme = theme ?? muiTheme
  const [fullWidth, setFullWidth] = useState<boolean>(false)
  const [minimized, setMinimized] = useState<boolean>(collapsed)
  const [display, setDisplay] = useState<boolean>(true)
  const baseSx = typeof sx === "function" ? sx(_theme) : (sx ?? [])

  const sxArray = Array.isArray(baseSx) ? baseSx : [baseSx]

  // Filter out invalid values
  const filteredSx = sxArray.filter(
    (
      style,
    ): style is
      | SystemStyleObject<Theme>
      | ((theme: Theme) => SystemStyleObject<Theme>) =>
      typeof style === "object" || typeof style === "function",
  )

  const finalSx = [
    ...filteredSx,
    {
      backgroundColor: _theme.palette.background.default,
      scrollbarWidth: fullWidth ? "none !important" : "thin !important",
    },
  ]

  const toggleMaximizeClick = () => {
    setFullWidth(prev => !prev)
    if (onMaximizeAction) onMaximizeAction()
  }

  const toggleMinimized = () => {
    setMinimized(prev => !prev)
    if (onMinimizeAction) onMinimizeAction()
  }

  const toggleClose = () => {
    setDisplay(prev => !prev)
    if (onCloseAction) onCloseAction()
  }

  useEffect(() => {
    if (fullWidth) {
      document.body.style.scrollbarWidth = "none"
    } else {
      document.body.style.scrollbarWidth = "thin"
    }
    if (show) {
      setDisplay(true)
    }
    if (collapsed) {
      setMinimized(true)
    }
    if (minimized) {
      setMinimized(true)
    }
  }, [fullWidth, show, collapsed, minimized, sx, theme])

  return (
    <Grid
      component={Paper}
      variant="elevation"
      elevation={12}
      pr={0.5}
      pl={0.5}
      pb={0.5}
      top={0}
      left={0}
      borderRadius={1}
      position={fullWidth ? "fixed" : "relative"}
      height={fullWidth ? "100vh" : "auto"}
      zIndex={fullWidth ? 1300 : "auto"}
      sx={finalSx}
      margin={"auto"}
      width={"100%"}
      display={display ? "flex" : "none"}
      flexDirection={"column"}
    >
      <Grid
        p={0}
        display={"flex"}
        width={"100%"}
        flexDirection={"row"}
        spacing={1}
        justifyContent={"end"}
      >
        {title && typeof title === "string" && (
          <Typography
            variant="h6"
            fontWeight={1}
            color={_theme.palette.text.primary}
            justifySelf={"start"}
            flexGrow={1}
            align={"justify"}
            m={"auto"}
          >
            {title}
          </Typography>
        )}
        {React.isValidElement(title) && (
          <Grid
            justifySelf={"start"}
            flexGrow={1}
            color={_theme.palette.text.primary}
          >
            {title}
          </Grid>
        )}
        {headersButtons && (
          <>
            {extraHeaderButtons}
            <IconButton
              size="small"
              onClick={() => {
                toggleMinimized()
              }}
            >
              <MinimizeIcon
                aria-label="Minimize"
                sx={{ color: _theme.palette.text.primary, fontSize: "1.0rem" }}
              />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                toggleMaximizeClick()
              }}
            >
              {fullWidth && (
                <FilterNoneIcon
                  sx={{
                    color: _theme.palette.text.primary,
                    fontSize: "1.0rem",
                  }}
                />
              )}
              {!fullWidth && (
                <CropDinIcon
                  sx={{
                    color: _theme.palette.text.primary,
                    fontSize: "1.0rem",
                  }}
                />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                toggleClose()
              }}
            >
              <CloseIcon
                sx={{ color: _theme.palette.text.primary, fontSize: "1.0rem" }}
              />
            </IconButton>
          </>
        )}
      </Grid>
      <Grid>
        <Collapse appear={!minimized} in={!minimized}>
          {component}
        </Collapse>
      </Grid>
    </Grid>
  )
}

export default Panel
