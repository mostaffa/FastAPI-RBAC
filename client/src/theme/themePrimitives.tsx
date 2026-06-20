import type { PaletteMode, Shadows } from "@mui/material/styles"
import { alpha, createTheme } from "@mui/material/styles"

const defaultTheme = createTheme()

type ColorScale = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

const customShadows: Shadows = [...defaultTheme.shadows]

export const brand: ColorScale = {
  50: "rgb(44, 116, 179)", // Prime
  100: "rgb(40, 104, 169)",
  200: "rgb(36, 93, 159)",
  300: "rgb(32, 82, 149)", // Prime
  400: "rgb(28, 76, 136)",
  500: "rgb(24, 71, 125)",
  600: "rgb(20, 66, 114)", // Prime
  700: "rgb(16, 56, 99)",
  800: "rgb(13, 47, 85)",
  900: "rgb(10, 38, 71)", // Prime
}

export const gray: ColorScale = {
  50: "rgb(230, 217, 190)", // Prime
  100: "rgb(160, 170, 210)",
  200: "rgb(140, 150, 190)",
  300: "rgb(120, 130, 170)", // Prime
  400: "rgb(100, 110, 150)",
  500: "rgb(80, 90, 130)",
  600: "rgb(60, 70, 110)", // Prime
  700: "rgb(40, 55, 90)",
  800: "rgb(20, 35, 70)",
  900: "rgb(10, 15, 50)", // Prime
}

export const green: ColorScale = {
  50: "hsl(156, 72%, 96%)",
  100: "hsl(156, 68%, 90%)",
  200: "hsl(157, 63%, 80%)",
  300: "hsl(158, 38%, 25%)",
  400: "hsl(159, 57%, 53%)",
  500: "hsl(158, 12%, 32%)",
  600: "hsl(163, 23%, 27%)",
  700: "hsl(164, 64%, 53%)",
  800: "hsl(166, 30%, 26%)",
  900: "hsl(169, 59%, 29%)",
}

export const orange: ColorScale = {
  50: "hsl(38, 100%, 96%)",
  100: "hsl(38, 97%, 89%)",
  200: "hsl(37, 96%, 78%)",
  300: "hsl(35, 93%, 66%)",
  400: "hsl(33, 91%, 54%)",
  500: "hsl(31, 92%, 46%)",
  600: "hsl(28, 92%, 38%)",
  700: "hsl(26, 93%, 31%)",
  800: "hsl(24, 94%, 24%)",
  900: "hsl(22, 95%, 18%)",
}

export const red: ColorScale = {
  50: "hsl(0, 100%, 97%)",
  100: "hsl(0, 94%, 91%)",
  200: "hsl(0, 92%, 81%)",
  300: "hsl(0, 88%, 69%)",
  400: "hsl(0, 83%, 58%)",
  500: "hsl(0, 78%, 48%)",
  600: "hsl(0, 79%, 40%)",
  700: "hsl(0, 80%, 32%)",
  800: "hsl(0, 82%, 24%)",
  900: "hsl(0, 84%, 17%)",
}

export const getDesignTokens = (mode: PaletteMode) => {
  customShadows[1] =
    mode === "dark"
      ? "hsla(222, 35%, 5%, 0.7) 0px 4px 16px 0px, hsla(222, 30%, 8%, 0.85) 0px 8px 20px -5px"
      : "hsla(220, 25%, 20%, 0.08) 0px 4px 16px 0px, hsla(220, 20%, 15%, 0.06) 0px 8px 20px -5px"

  return {
    palette: {
      mode,
      primary: {
        light: brand[100],
        main: mode === "dark" ? brand[900] : brand[100],
        dark: brand[800],
        contrastText: brand[50],
      },
      secondary: {
        light: green[300],
        main: mode === "dark" ? green[400] : green[600],
        dark: green[800],
        contrastText: gray[50],
      },
      info: {
        light: brand[100],
        main: mode === "dark" ? brand[400] : brand[500],
        dark: brand[700],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[300],
        main: red[500],
        dark: red[700],
      },
      success: {
        light: green[300],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: mode === "dark" ? alpha(gray[600], 0.45) : alpha(gray[300], 0.7),
      background: {
        default: mode === "dark" ? gray[900] : "hsl(210, 40%, 98%)",
        paper: mode === "dark" ? "hsl(226, 20%, 15%)" : "hsl(0, 0%, 100%)",
      },
      text: {
        primary: mode === "dark" ? "hsl(0, 0%, 98%)" : gray[900],
        secondary: mode === "dark" ? gray[300] : gray[600],
        warning: orange[500],
      },
      action: {
        hover: mode === "dark" ? alpha(gray[600], 0.2) : alpha(gray[200], 0.32),
        selected:
          mode === "dark" ? alpha(gray[500], 0.3) : alpha(gray[200], 0.45),
      },
    },
    typography,
    shape,
    shadows: customShadows,
  }
}

export const colorSchemes = {
  light: {
    palette: {
      primary: {
        light: brand[300],
        main: gray[900],
        dark: brand[800],
        contrastText: brand[100],
      },
      secondary: {
        light: green[300],
        main: green[600],
        dark: green[800],
        contrastText: gray[50],
      },
      info: {
        light: brand[300],
        main: brand[500],
        dark: brand[700],
        contrastText: gray[50],
      },
      warning: {
        light: orange[300],
        main: orange[500],
        dark: orange[800],
      },
      error: {
        light: red[300],
        main: red[500],
        dark: red[800],
      },
      success: {
        light: green[300],
        main: green[500],
        dark: green[800],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[300], 0.7),
      background: {
        default: alpha(orange[100], 0.3),
        paper: orange[50],
      },
      text: {
        primary: "rgb(0, 0, 0)",
        secondary: gray[300],
        warning: orange[500],
      },
      action: {
        hover: alpha(gray[200], 0.32),
        selected: alpha(gray[200], 0.45),
      },
      baseShadow:
        "hsla(220, 25%, 20%, 0.08) 0px 4px 16px 0px, hsla(220, 20%, 15%, 0.06) 0px 8px 20px -5px",
    },
  },
  dark: {
    palette: {
      primary: {
        contrastText: brand[900],
        light: brand[300],
        main: brand[50],
        dark: brand[700],
      },
      secondary: {
        contrastText: gray[50],
        light: green[300],
        main: green[50],
        dark: green[900],
      },
      info: {
        contrastText: gray[50],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      },
      warning: {
        light: orange[300],
        main: orange[400],
        dark: orange[700],
      },
      error: {
        light: red[300],
        main: red[500],
        dark: red[700],
      },
      success: {
        light: green[300],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[50], 0.2),
      background: {
        default: gray[900],
        paper: gray[900],
      },
      text: {
        primary: "hsl(0, 0%, 100%)",
        secondary: gray[50],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[500], 0.3),
      },
      baseShadow:
        "hsla(222, 35%, 5%, 0.7) 0px 4px 16px 0px, hsla(222, 30%, 8%, 0.85) 0px 8px 20px -5px",
    },
  },
}

export const typography = {
  fontFamily: "Inter, sans-serif",
  h1: {
    fontSize: defaultTheme.typography.pxToRem(48),
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: defaultTheme.typography.pxToRem(36),
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: defaultTheme.typography.pxToRem(30),
    lineHeight: 1.2,
  },
  h4: {
    fontSize: defaultTheme.typography.pxToRem(24),
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: defaultTheme.typography.pxToRem(20),
    fontWeight: 600,
  },
  h6: {
    fontSize: defaultTheme.typography.pxToRem(18),
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: defaultTheme.typography.pxToRem(18),
  },
  subtitle2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 500,
  },
  body1: {
    fontSize: defaultTheme.typography.pxToRem(14),
  },
  body2: {
    fontSize: defaultTheme.typography.pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontSize: defaultTheme.typography.pxToRem(12),
    fontWeight: 400,
  },
}

export const shape = {
  borderRadius: 6,
}

// @ts-expect-error - Custom shadow values don't match the default Shadows type structure
const defaultShadows: Shadows = [
  "none",
  "var(--template-palette-baseShadow)",
  ...defaultTheme.shadows.slice(2),
]
export const shadows = defaultShadows
