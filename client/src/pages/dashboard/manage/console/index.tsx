import { useEffect, useRef, useCallback, useState } from 'react'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import useSocket from '../../../../hooks/useSocket/useSocket'
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Panel from '../../../../components/ui/panel/Panel'
import Button from '@mui/material/Button'

export default function Console() {
    const { socket } = useSocket()
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const procId = useRef<number | null>(null)
    const [pid, setPid] = useState<number | null>(null)

    const handleData = useCallback((data: string) => {
        if (xtermRef.current) {
            xtermRef.current.write(data);
        };
    }, [])

    const handleWindowResize = useCallback(() => {
        fitAddonRef.current?.fit();
    
}, [])

const initializeTerminal = useCallback(() => {
    xtermRef.current = new Terminal({
            cursorBlink: true,
            convertEol: true,
            // theme: { background: '#1e1e1e',  selectionForeground: "red", selectionBackground: "yellow" },
        });

        const fitAddon = new FitAddon();
        xtermRef.current.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        if (terminalRef.current)
            xtermRef.current.open(terminalRef.current);

        fitAddon.fit();
}, [])

    useEffect(() => {

    if (!xtermRef.current) {
        initializeTerminal()
    }

    if (!socket || !xtermRef.current) return;

    socket.emit('start_terminal', null);

    socket.on("terminal_data", handleData);
    socket.on("terminal_pid", (pid: number) => {procId.current = pid; setPid(pid)});
    const onDataDisposable = xtermRef.current.onData((input: string) => {
        socket.emit("terminal_input", { input });
    });

    const onResizeDisposable = xtermRef.current.onResize(({ cols, rows }) => {
        socket.emit("terminal_resize", { cols, rows });
    });

    window.addEventListener('resize', handleWindowResize);

    return () => {
        socket.emit("stop_terminal", String(procId.current));
        console.log("Killing Terminal with processID:", procId.current)
        socket.off("terminal_data");
        socket.off("terminal_pid");
        onDataDisposable.dispose();
        onResizeDisposable.dispose();
        window.removeEventListener('resize', handleWindowResize);
    };

}, [socket, handleData, handleWindowResize, initializeTerminal]);
    

    return (
        <Grid sx={{width: "100%"}}>
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
                    title={"Terminal " + String(pid)}
                    component={
                        <Paper
                            elevation={3}
                            sx={{
                                p: 0,
                                backgroundColor: '#1e1e1e',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Use the ref here */}
                            <div
                                ref={terminalRef}
                                style={{ height: 'calc(90vh - 40px)', width: '100%', padding: "0" }}
                            />
                        </Paper>
                    }
                    onMaximizeAction={() => {
                        terminalRef.current?.style.setProperty("height", "100vh")
                        handleWindowResize()
                    }}
                    onMinimizeAction={() => {
                        terminalRef.current?.style.setProperty("height", "calc(90vh - 40px)")
                        handleWindowResize()
                    }}
                    onCloseAction={() => {socket?.emit("stop_terminal", String(procId.current)); setPid(null)}}
                />
            </Grid>
            {!pid && <Container><Grid size={12} pt={1}>
                    <Button variant='contained' size='large' onClick={() => {socket?.emit('start_terminal', null); initializeTerminal()}} disabled={pid === null ? false: true}>
                        Start a new Terminal Session
                    </Button>
                </Grid></Container>}
        </Grid>
    )
}