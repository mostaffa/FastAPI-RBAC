import { createContext } from "react"
import type { CloseDialog, OpenDialog } from "./useDialogs"

const DialogsContext = createContext<{
  open: OpenDialog
  close: CloseDialog
} | null>(null)

export default DialogsContext
