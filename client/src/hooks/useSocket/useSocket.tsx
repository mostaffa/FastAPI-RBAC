import { useContext, useMemo } from "react"
import SocketContext from "./SocketContext"

export default function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return useMemo(() => context, [context])
}
