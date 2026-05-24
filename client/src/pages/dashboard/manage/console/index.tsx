import { useEffect, useRef, useCallback, useState } from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import useSocket from "../../../../hooks/useSocket/useSocket"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import Panel from "../../../../components/ui/panel/Panel"
import Button from "@mui/material/Button"

const terminalLifecycleState = {
  startRequested: false,
  pid: null as number | null,
  lastStartAt: 0,
}

export default function Console() {
  const { socket } = useSocket()
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const procId = useRef<number | null>(null)
  const lastResizeRef = useRef<{ cols: number; rows: number } | null>(null)
  const resizeFrameRef = useRef<number | null>(null)
  const [pid, setPid] = useState<number | null>(null)

  const handleData = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data)
    }
  }, [])

  const handleWindowResize = useCallback(() => {
    fitAddonRef.current?.fit()
  }, [])

  const initializeTerminal = useCallback(() => {
    xtermRef.current = new Terminal({
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: "#1e1e1e",
        selectionForeground: "red",
        selectionBackground: "yellow",
        cursor: "hsl(130, 100%, 50%)",
      },
      allowTransparency: true,
      fontSize: 16,
      allowProposedApi: true,
      documentOverride: true,
      altClickMovesCursor: true,
    })

    const fitAddon = new FitAddon()
    xtermRef.current.loadAddon(fitAddon)
    fitAddonRef.current = fitAddon

    if (terminalRef.current) xtermRef.current.open(terminalRef.current)

    fitAddon.fit()
  }, [])

  const requestStartTerminal = useCallback(() => {
    if (
      !socket ||
      terminalLifecycleState.startRequested ||
      terminalLifecycleState.pid
    )
      return

    // In React StrictMode, remount can happen immediately and would otherwise duplicate start requests.
    if (Date.now() - terminalLifecycleState.lastStartAt < 200) return

    terminalLifecycleState.startRequested = true
    terminalLifecycleState.lastStartAt = Date.now()
    socket.emit("start_terminal", null)
  }, [socket])

  const onResize = useCallback(
    (cols: number, rows: number) => {
      if (!lastResizeRef.current) {
        lastResizeRef.current = { cols, rows }
        return
      }
      if (
        lastResizeRef.current.cols === cols &&
        lastResizeRef.current.rows === rows
      ) {
        return
      }

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current)
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        if (!socket) return
        lastResizeRef.current = { cols, rows }
        socket.emit("terminal_resize", { cols, rows })
      })
    },
    [socket],
  )

  useEffect(() => {
    if (!xtermRef.current) {
      initializeTerminal()
    }

    if (!socket || !xtermRef.current) return

    if (!procId.current) {
      requestStartTerminal()
    }

    const handlePid = (pid: number) => {
      procId.current = pid
      terminalLifecycleState.pid = pid
      terminalLifecycleState.startRequested = true
      setPid(pid)
    }

    socket.on("terminal_data", handleData)
    socket.on("terminal_pid", handlePid)
    const onDataDisposable = xtermRef.current.onData((input: string) => {
      socket.emit("terminal_input", { input })
    })

    const onResizeDisposable = xtermRef.current.onResize(({ cols, rows }) => {
      onResize(cols, rows)
    })

    window.addEventListener("resize", handleWindowResize)

    return () => {
      if (procId.current) socket.emit("stop_terminal", String(procId.current))

      procId.current = null
      terminalLifecycleState.pid = null
      terminalLifecycleState.startRequested = false

      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current)
        resizeFrameRef.current = null
      }

      socket.off("terminal_data")
      socket.off("terminal_pid", handlePid)
      onDataDisposable.dispose()
      onResizeDisposable.dispose()
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [
    socket,
    handleData,
    handleWindowResize,
    initializeTerminal,
    onResize,
    requestStartTerminal,
  ])

  return (
    <Grid sx={{ width: "100%" }}>
      {/* <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid
                    size={{ xs: 12, sm: 12, md: 8, lg: 8, xl: 8 }}
                    component={Paper}
                    elevation={3}
                    sx={{ p: 2 }}
                >
                    <Typography variant="h4" gutterBottom>
                        Services
                    </Typography>
                    <Typography variant="body1">
                        All available Services in the system are listed here. You can view the services but
                        Manage this services requires permissions.
                    </Typography>
                </Grid>
            </Grid> */}
      <Grid size={12} pt={1}>
        <Panel
          title={"Terminal " + String(procId.current)}
          component={
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                backgroundColor: "#1e1e1e",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {/* Use the ref here */}
              <div
                ref={terminalRef}
                style={{
                  height: "calc(90vh - 40px)",
                  width: "100%",
                  padding: "2px",
                  borderRadius: "2px",
                }}
              />
            </Paper>
          }
          onMaximizeAction={() => {
            terminalRef.current?.style.setProperty("height", "100vh")
            handleWindowResize()
          }}
          onMinimizeAction={() => {
            terminalRef.current?.style.setProperty(
              "height",
              "calc(90vh - 40px)",
            )
            handleWindowResize()
          }}
          onCloseAction={() => {
            socket?.emit("stop_terminal", String(procId.current))
            procId.current = null
            terminalLifecycleState.pid = null
            terminalLifecycleState.startRequested = false
            setPid(null)
          }}
        />
      </Grid>
      {!pid && (
        <Container>
          <Grid size={12} pt={1}>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                initializeTerminal()
                requestStartTerminal()
              }}
              disabled={pid !== null}
            >
              Start a new Terminal Session
            </Button>
          </Grid>
        </Container>
      )}
    </Grid>
  )
}
