import { useEffect } from "react"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import useSocket from "../../../../hooks/useSocket/useSocket"

export default function Status(){
    const {socket} = useSocket();

    useEffect(() => {
        if(socket?.connected){
            socket.emit("realtime", null);
            socket.on("realtime", message => {
                console.log(message)
            })
        }
        return( ()=> {
            socket?.off("realtime")
        })
    }, [socket])
    return (
        <Container>
            <Grid component={Paper} elevation={2}>
                <Typography variant="h1">Realtime Data</Typography>
            </Grid>
        </Container>
    )
}
