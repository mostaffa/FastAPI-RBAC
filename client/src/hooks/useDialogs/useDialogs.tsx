import * as React from "react"
// import Button from "@mui/material/Button"
// import Dialog from "@mui/material/Dialog"
// import DialogActions from "@mui/material/DialogActions"
// import DialogContent from "@mui/material/DialogContent"
// import DialogContentText from "@mui/material/DialogContentText"
// import DialogTitle from "@mui/material/DialogTitle"
// import TextField from "@mui/material/TextField"
import useEventCallback from "@mui/utils/useEventCallback"
import DialogsContext from "./DialogsContext"
import {
  AlertDialog,
  ConfirmDialog,
  PromptDialog,
  ContentDialog,
} from "./DialogComponents"

export type OpenDialogOptions<R> = {
  /**
   * A function that is called before closing the dialog closes. The dialog
   * stays open as long as the returned promise is not resolved. Use this if
   * you want to perform an async action on close and show a loading state.
   *
   * @param result The result that the dialog will return after closing.
   * @returns A promise that resolves when the dialog can be closed.
   */
  msg?: React.ReactNode | string
  title?: React.ReactNode | string
  onClose?: (result: R) => Promise<void>
}

export type AlertOptions = {
  /**
   * A title for the dialog. Defaults to `'Alert'`.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ok'`.
   */
  okText?: React.ReactNode
} & OpenDialogOptions<void>

export type ConfirmOptions = {
  /**
   * A title for the dialog. Defaults to `'Confirm'`.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ok'`.
   */
  okText?: React.ReactNode
  /**
   * Denotes the purpose of the dialog. This will affect the color of the
   * "Ok" button. Defaults to `undefined`.
   */
  severity?: "error" | "info" | "success" | "warning"
  /**
   * The text to show in the "Cancel" button. Defaults to `'Cancel'`.
   */
  cancelText?: React.ReactNode
} & OpenDialogOptions<boolean>

export type PromptOptions = {
  /**
   * A title for the dialog. Defaults to `'Prompt'`.
   */
  title?: React.ReactNode
  /**
   * The text to show in the "Ok" button. Defaults to `'Ok'`.
   */
  okText?: React.ReactNode
  /**
   * The text to show in the "Cancel" button. Defaults to `'Cancel'`.
   */
  cancelText?: React.ReactNode
} & OpenDialogOptions<string | null>

/**
 * The props that are passed to a dialog component.
 */
export type DialogProps<P = undefined, R = void> = {
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: P
  /**
   * Whether the dialog is open.
   */
  open: boolean
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: (result: R) => Promise<void>
}

/**
 * Open an alert dialog. Returns a promise that resolves when the user
 * closes the dialog.
 *
 * @param msg The message to show in the dialog.
 * @param options Additional options for the dialog.
 * @returns A promise that resolves when the dialog is closed.
 */
export type OpenAlertDialog = (
  msg: React.ReactNode,
  options?: AlertOptions,
) => Promise<void>

export type OpenContentDialog = (
  msg: React.ReactNode,
  options?: OpenDialogOptions<void>,
) => Promise<void>

/**
 * Open a confirmation dialog. Returns a promise that resolves to true if
 * the user confirms, false if the user cancels.
 *
 * @param msg The message to show in the dialog.
 * @param options Additional options for the dialog.
 * @returns A promise that resolves to true if the user confirms, false if the user cancels.
 */
export type OpenConfirmDialog = (
  msg: React.ReactNode,
  options?: ConfirmOptions,
) => Promise<boolean>

/**
 * Open a prompt dialog to request user input. Returns a promise that resolves to the input
 * if the user confirms, null if the user cancels.
 *
 * @param msg The message to show in the dialog.
 * @param options Additional options for the dialog.
 * @returns A promise that resolves to the user input if the user confirms, null if the user cancels.
 */
export type OpenPromptDialog = (
  msg: React.ReactNode,
  options?: PromptOptions,
) => Promise<string | null>

export type DialogComponent<P, R> = React.ComponentType<DialogProps<P, R>>

export type OpenDialog = {
  /**
   * Open a dialog without payload.
   * @param Component The dialog component to open.
   * @param options Additional options for the dialog.
   */
  <P extends undefined, R>(
    Component: DialogComponent<P, R>,
    payload?: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>
  /**
   * Open a dialog and pass a payload.
   * @param Component The dialog component to open.
   * @param payload The payload to pass to the dialog.
   * @param options Additional options for the dialog.
   */
  <P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>
}

/**
 * Close a dialog and return a result.
 * @param dialog The dialog to close. The promise returned by `open`.
 * @param result The result to return from the dialog.
 * @returns A promise that resolves when the dialog is fully closed.
 */
export type CloseDialog = <R>(dialog: Promise<R>, result: R) => Promise<R>

export type DialogHook = {
  alert: OpenAlertDialog
  confirm: OpenConfirmDialog
  contentDialog: OpenContentDialog
  prompt: OpenPromptDialog
  open: OpenDialog
  close: CloseDialog
}

// function useDialogLoadingButton(onClose: () => Promise<void>) {
//   const [loading, setLoading] = React.useState(false)
//   const handleClick = async () => {
//     try {
//       setLoading(true)
//       await onClose()
//     } finally {
//       setLoading(false)
//     }
//   }
//   return {
//     onClick: handleClick,
//     loading,
//   }
// }

export type AlertDialogPayload = {
  msg: React.ReactNode
} & AlertOptions

export type AlertDialogProps = {} & DialogProps<AlertDialogPayload>

// export function AlertDialog({ open, payload, onClose }: AlertDialogProps) {
//   const okButtonProps = useDialogLoadingButton(() => onClose())

//   return (
//     <Dialog
//       maxWidth="xs"
//       fullWidth
//       open={open}
//       onClose={() => {
//         void onClose()
//         document.getElementById("root")?.setAttribute("aria-hidden", "false")
//       }}
//     >
//       <DialogTitle>{payload.title ?? "Alert"}</DialogTitle>
//       <DialogContent>{payload.msg}</DialogContent>
//       <DialogActions>
//         <Button disabled={!open} {...okButtonProps}>
//           {payload.okText ?? "Ok"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

export type ConfirmDialogPayload = {
  msg: React.ReactNode
} & ConfirmOptions

export type ConfirmDialogProps = {} & DialogProps<ConfirmDialogPayload, boolean>

// export function ConfirmDialog({ open, payload, onClose }: ConfirmDialogProps) {
//   const cancelButtonProps = useDialogLoadingButton(() => onClose(false))
//   const okButtonProps = useDialogLoadingButton(() => onClose(true))

//   return (
//     <Dialog
//       maxWidth="xs"
//       fullWidth
//       open={open}
//       onClose={() => {
//         void onClose(false)
//         document.getElementById("root")?.setAttribute("aria-hidden", "false")
//       }}
//     >
//       <DialogTitle>{payload.title ?? "Confirm"}</DialogTitle>
//       <DialogContent>{payload.msg}</DialogContent>
//       <DialogActions>
//         <Button autoFocus disabled={!open} {...cancelButtonProps}>
//           {payload.cancelText ?? "Cancel"}
//         </Button>
//         <Button color={payload.severity} disabled={!open} {...okButtonProps}>
//           {payload.okText ?? "Ok"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

export type PromptDialogPayload = {
  msg: React.ReactNode
} & PromptOptions

export type PromptDialogProps = {} & DialogProps<
  PromptDialogPayload,
  string | null
>

// export function PromptDialog({ open, payload, onClose }: PromptDialogProps) {
//   const [input, setInput] = React.useState("")
//   const cancelButtonProps = useDialogLoadingButton(() => onClose(null))

//   const [loading, setLoading] = React.useState(false)

//   const name = "input"
//   return (
//     <Dialog
//       maxWidth="xs"
//       fullWidth
//       open={open}
//       onClose={() => {
//         void onClose(null)
//         document.getElementById("root")?.setAttribute("aria-hidden", "false")
//       }}
//       slotProps={{
//         paper: {
//           component: "form",
//           onSubmit: (event: React.FormEvent<HTMLDivElement>) => {
//             event.preventDefault()
//             void (async () => {
//               try {
//                 setLoading(true)
//                 const formData = new FormData(event.currentTarget as unknown as HTMLFormElement)
//                 const value = formData.get(name) ?? ""

//                 if (typeof value !== "string") {
//                   throw new Error("Value must come from a text input.")
//                 }

//                 await onClose(value)
//               } finally {
//                 setLoading(false)
//               }
//             })()
//           },
//         },
//       }}
//     >
//       <DialogTitle>{payload.title ?? "Confirm"}</DialogTitle>
//       <DialogContent>
//         <DialogContentText>{payload.msg} </DialogContentText>
//         <TextField
//           autoFocus
//           required
//           margin="dense"
//           id="name"
//           name={name}
//           type="text"
//           fullWidth
//           variant="standard"
//           value={input}
//           onChange={event => {
//             setInput(event.target.value)
//           }}
//         />
//       </DialogContent>
//       <DialogActions>
//         <Button disabled={!open} {...cancelButtonProps}>
//           {payload.cancelText ?? "Cancel"}
//         </Button>
//         <Button disabled={!open} loading={loading} type="submit">
//           {payload.okText ?? "Ok"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   )
// }

export function useDialogs(): DialogHook {
  const dialogsContext = React.useContext(DialogsContext)
  if (!dialogsContext) {
    throw new Error("Dialogs context was used without a provider.")
  }
  const { open, close } = dialogsContext

  const alert = useEventCallback<OpenAlertDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(AlertDialog, { ...options, msg }, { onClose }),
  )

  const confirm = useEventCallback<OpenConfirmDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(ConfirmDialog, { ...options, msg }, { onClose }),
  )

  const prompt = useEventCallback<OpenPromptDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(PromptDialog, { ...options, msg }, { onClose }),
  )

  const contentDialog = useEventCallback<OpenContentDialog>(
    (msg, { onClose, ...options } = {}) =>
      open(ContentDialog, { ...options, msg }, { onClose }),
  )

  return React.useMemo(
    () => ({
      alert,
      confirm,
      prompt,
      contentDialog,
      open,
      close,
    }),
    [alert, close, confirm, open, prompt, contentDialog],
  )
}
