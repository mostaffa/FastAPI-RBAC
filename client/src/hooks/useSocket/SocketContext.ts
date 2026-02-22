import * as React from "react"
import type { Socket } from "socket.io-client"
import type { SocketMessage } from "./SocketProvider"

type SocketContextType = {
  socket: Socket | null
  status: string
  message: SocketMessage | null
  setMessage: React.Dispatch<React.SetStateAction<SocketMessage | null>>
}

const SocketContext = React.createContext<SocketContextType | null>(null)

export default SocketContext
