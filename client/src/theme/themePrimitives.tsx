import type { PaletteMode, Shadows } from "@mui/material/styles"
import { createTheme, alpha } from "@mui/material/styles"

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
  50: "hsl(206, 100%, 97%)",
  100: "hsl(206, 96%, 92%)",
  200: "hsl(207, 94%, 84%)",
  300: "hsl(208, 91%, 73%)",
  400: "hsl(209, 89%, 61%)",
  500: "hsl(210, 87%, 52%)",
  600: "hsl(211, 89%, 44%)",
  700: "hsl(212, 91%, 36%)",
  800: "hsl(214, 93%, 27%)",
  900: "hsl(216, 95%, 18%)",
}

export const gray: ColorScale = {
  50: "hsl(210, 20%, 98%)",
  100: "hsl(214, 22%, 95%)",
  200: "hsl(216, 18%, 88%)",
  300: "hsl(217, 15%, 78%)",
  400: "hsl(218, 12%, 62%)",
  500: "hsl(220, 13%, 48%)",
  600: "hsl(222, 16%, 36%)",
  700: "hsl(224, 20%, 26%)",
  800: "hsl(226, 24%, 17%)",
  900: "hsl(228, 30%, 11%)",
}

export const green: ColorScale = {
  50: "hsl(156, 72%, 96%)",
  100: "hsl(156, 68%, 90%)",
  200: "hsl(157, 63%, 80%)",
  300: "hsl(158, 58%, 67%)",
  400: "hsl(159, 57%, 53%)",
  500: "hsl(160, 67%, 40%)",
  600: "hsl(162, 74%, 32%)",
  700: "hsl(164, 80%, 24%)",
  800: "hsl(166, 84%, 18%)",
  900: "hsl(168, 87%, 12%)",
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
        light: brand[300],
        main: mode === "dark" ? brand[400] : brand[600],
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
        light: brand[300],
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
        primary: mode === "dark" ? "hsl(0, 0%, 98%)" : gray[800],
        secondary: mode === "dark" ? gray[300] : gray[600],
        warning: orange[500],
      },
      action: {
        hover: mode === "dark" ? alpha(gray[600], 0.2) : alpha(gray[200], 0.32),
        selected: mode === "dark" ? alpha(gray[500], 0.3) : alpha(gray[200], 0.45),
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
        main: brand[600],
        dark: brand[800],
        contrastText: brand[50],
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
        default: "hsl(210, 40%, 98%)",
        paper: "hsl(0, 0%, 100%)",
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
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
        contrastText: brand[50],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      },
      secondary: {
        contrastText: gray[50],
        light: green[300],
        main: green[400],
        dark: green[700],
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
      divider: alpha(gray[600], 0.45),
      background: {
        default: gray[900],
        paper: "hsl(226, 20%, 15%)",
      },
      text: {
        primary: "hsl(0, 0%, 98%)",
        secondary: gray[300],
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
  borderRadius: 12,
}

// @ts-expect-error - Custom shadow values don't match the default Shadows type structure
const defaultShadows: Shadows = [
  "none",
  "var(--template-palette-baseShadow)",
  ...defaultTheme.shadows.slice(2),
]
export const shadows = defaultShadows
