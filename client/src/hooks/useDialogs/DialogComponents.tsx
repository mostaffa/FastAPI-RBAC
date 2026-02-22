import * as React from "react"
import PropTypes from "prop-types"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"
import type { SlideProps } from "@mui/material/Slide"
import Slide from "@mui/material/Slide"
import CloseIcon from "@mui/icons-material/Close"
import IconButton from "@mui/material/IconButton"

type DialogTransitionDirection = "up" | "down" | "left" | "right"
type DialogWidth = "xs" | "sm" | "md" | "lg" | "xl"
type DialogSeverity = "error" | "info" | "success" | "warning"

type BaseDialogPayload = {
  msg?: React.ReactNode
  onClose?: () => void | Promise<void>
  severity?: DialogSeverity
  transitionDirection?: DialogTransitionDirection
  width?: DialogWidth
  backdropColor?: string
  title?: React.ReactNode
  ariaDescribedby?: string
}

type AlertDialogPayload = BaseDialogPayload & {
  okText?: React.ReactNode
}

type ConfirmDialogPayload = BaseDialogPayload & {
  cancelText?: React.ReactNode
  okText?: React.ReactNode
}

type PromptDialogPayload = BaseDialogPayload & {
  cancelText?: React.ReactNode
  okText?: React.ReactNode
}

type ContentDialogPayload = BaseDialogPayload

type DialogProps<TPayload, TResult> = {
  open: boolean
  payload: TPayload
  onClose: (result: TResult) => void | Promise<void>
}

const TransitionDown = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" timeout={{ exit: 100 }} ref={ref} {...props} />
})

const TransitionUp = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" timeout={{ exit: 100 }} ref={ref} {...props} />
})

const TransitionLeft = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return (
    <Slide
      direction="left"
      timeout={{ exit: 1000, enter: 1000 }}
      ref={ref}
      {...props}
    />
  )
})

const TransitionRight = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return (
    <Slide
      direction="right"
      timeout={{ exit: 1000, enter: 1000 }}
      ref={ref}
      {...props}
    />
  )
})

function useDialogLoadingButton(onClose: () => void | Promise<void>) {
  const [loading, setLoading] = React.useState(false)
  const handleClick = () => {
    void (async () => {
      try {
        setLoading(true)
        await onClose()
      } finally {
        setLoading(false)
        document.getElementById("root")?.setAttribute("aria-hidden", "false")
      }
    })()
  }
  return {
    onClick: handleClick,
    loading,
  }
}

export function AlertDialog({
  open,
  payload,
  onClose,
}: DialogProps<AlertDialogPayload, void>) {
  const okButtonProps = useDialogLoadingButton(() => onClose())
  return (
    <Dialog
      keepMounted
      maxWidth={payload.width ?? "xs"}
      fullWidth
      open={open}
      onClose={() => {
        void onClose()
      }}
      slots={{
        transition:
          payload.transitionDirection === "down"
            ? TransitionDown
            : payload.transitionDirection === "up"
              ? TransitionUp
              : payload.transitionDirection === "left"
                ? TransitionLeft
                : payload.transitionDirection === "right"
                  ? TransitionRight
                  : TransitionUp,
      }}
      slotProps={{
        paper: {
          elevation: 24,
          sx: {
            borderRadius: "8px",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: payload.backdropColor ?? "rgba(0, 0, 0, 0.5)",
          },
        },
        root: {
          "aria-describedby": "alert-dialog-description",
        },
      }}
      aria-describedby={payload.ariaDescribedby ?? "alert-dialog-description"}
      closeAfterTransition={true}
    >
      <DialogTitle
        color={payload.severity}
        sx={{
          background:
            "linear-gradient(90deg,rgba(96, 7, 40, 0.1) 0%, rgba(255, 170, 51, 0.1) 73%)",
          mb: 2,
        }}
      >
        {payload.title ?? "Alert"}
        <IconButton
          aria-label="close"
          onClick={() => {
            void onClose()
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent id={payload.ariaDescribedby ?? "alert-dialog-description"}>
        {payload.msg}
      </DialogContent>
      <DialogActions>
        <Button disabled={!open} variant="outlined" {...okButtonProps}>
          {payload.okText ?? "Ok"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

AlertDialog.propTypes = {
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Whether the dialog is open.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: PropTypes.shape({
    msg: PropTypes.node,
    okText: PropTypes.node,
    onClose: PropTypes.func,
    severity: PropTypes.oneOf(["error", "info", "success", "warning"]),
    transitionDirection: PropTypes.oneOf(["up", "down", "left", "right"]),
    width: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    backdropColor: PropTypes.string,
    title: PropTypes.node,
    ariaDescribedby: PropTypes.string,
  }).isRequired,
}

export function ConfirmDialog({
  open,
  payload,
  onClose,
}: DialogProps<ConfirmDialogPayload, boolean>) {
  const cancelButtonProps = useDialogLoadingButton(() => onClose(false))
  const okButtonProps = useDialogLoadingButton(() => onClose(true))

  return (
    <Dialog
      maxWidth={payload.width ?? "xs"}
      fullWidth
      open={open}
      onClose={() => {
        void onClose(false)
        document.getElementById("root")?.setAttribute("aria-hidden", "false")
      }}
      slots={{
        transition:
          payload.transitionDirection === "down"
            ? TransitionDown
            : payload.transitionDirection === "up"
              ? TransitionUp
              : payload.transitionDirection === "left"
                ? TransitionLeft
                : payload.transitionDirection === "right"
                  ? TransitionRight
                  : TransitionUp,
      }}
      slotProps={{
        paper: {
          elevation: 24,
          sx: {
            borderRadius: "8px",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: payload.backdropColor ?? "rgba(0, 0, 0, 0.5)",
          },
        },
        root: {
          "aria-describedby": "alert-dialog-description",
        },
      }}
    >
      <DialogTitle
        sx={{
          background:
            "linear-gradient(90deg,rgba(96, 7, 40, 0.1) 0%, rgba(255, 170, 51, 0.1) 73%)",
          mb: 2,
        }}
      >
        {payload.title ?? "Confirm"}
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 0, sm: 0, md: 2, lg: 2, xl: 2 } }}>
        {payload.msg ?? null}
        <IconButton
          aria-label="close"
          onClick={() => {
            void onClose(false)
            document
              .getElementById("root")
              ?.setAttribute("aria-hidden", "false")
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          disabled={!open}
          variant="outlined"
          {...cancelButtonProps}
        >
          {payload.cancelText ?? "Cancel"}
        </Button>
        <Button
          color={payload.severity}
          disabled={!open}
          variant="outlined"
          {...okButtonProps}
        >
          {payload.okText ?? "Ok"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

ConfirmDialog.propTypes = {
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Whether the dialog is open.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: PropTypes.shape({
    cancelText: PropTypes.node,
    msg: PropTypes.node,
    okText: PropTypes.node,
    onClose: PropTypes.func,
    severity: PropTypes.oneOf(["error", "info", "success", "warning"]),
    transitionDirection: PropTypes.oneOf(["up", "down", "left", "right"]),
    backdropColor: PropTypes.string,
    width: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  }).isRequired,
}

export function PromptDialog({
  open,
  payload,
  onClose,
}: DialogProps<PromptDialogPayload, string | null>) {
  const [input, setInput] = React.useState("")
  const cancelButtonProps = useDialogLoadingButton(() => onClose(null))

  const [loading, setLoading] = React.useState(false)
  const name = "input"
  const handleSubmit: React.SubmitEventHandler<HTMLDivElement> = event => {
    event.preventDefault()
    void (async () => {
      try {
        setLoading(true)
        await onClose(input)
      } finally {
        setLoading(false)
      }
    })()
  }
  return (
    <Dialog
      closeAfterTransition={true}
      maxWidth={payload.width ?? "xs"}
      fullWidth
      open={open}
      security=""
      onClose={() => {
        void onClose(null)
      }}
      slotProps={{
        paper: {
          component: "form",
          elevation: 24,
          sx: {
            borderRadius: "8px",
            background: theme => theme.palette.background.paper,
          },
          onSubmit: handleSubmit,
        },
      }}
      slots={{
        transition:
          payload.transitionDirection === "down"
            ? TransitionDown
            : payload.transitionDirection === "up"
              ? TransitionUp
              : payload.transitionDirection === "left"
                ? TransitionLeft
                : payload.transitionDirection === "right"
                  ? TransitionRight
                  : TransitionUp,
      }}
    >
      <DialogTitle>
        {payload.title ?? "Confirm"}
        <IconButton
          aria-label="close"
          onClick={() => {
            void onClose(null)
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {payload.msg}
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name={name}
          type="text"
          fullWidth
          variant="standard"
          value={input}
          onChange={event => {
            setInput(event.target.value)
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={!open} {...cancelButtonProps}>
          {payload.cancelText ?? "Cancel"}
        </Button>
        <Button disabled={!open} loading={loading} type="submit">
          {payload.okText ?? "Ok"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

PromptDialog.propTypes = {
  /**
   * A function to call when the dialog should be closed. If the dialog has a return
   * value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Whether the dialog is open.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: PropTypes.shape({
    cancelText: PropTypes.node,
    msg: PropTypes.node,
    okText: PropTypes.node,
    onClose: PropTypes.func,
    severity: PropTypes.oneOf(["error", "info", "success", "warning"]),
    transitionDirection: PropTypes.oneOf(["up", "down", "left", "right"]),
    width: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    title: PropTypes.node,
  }).isRequired,
}

export function ContentDialog({
  open,
  payload,
  onClose,
}: DialogProps<ContentDialogPayload, void>) {
  return (
    <Dialog
      keepMounted
      maxWidth={payload.width ?? "xs"}
      fullWidth
      open={open}
      onClose={() => {
        void onClose()
        document.getElementById("root")?.setAttribute("aria-hidden", "false")
      }}
      slots={{
        transition:
          payload.transitionDirection === "down"
            ? TransitionDown
            : payload.transitionDirection === "up"
              ? TransitionUp
              : payload.transitionDirection === "left"
                ? TransitionLeft
                : payload.transitionDirection === "right"
                  ? TransitionRight
                  : TransitionUp,
      }}
      slotProps={{
        paper: {
          elevation: 24,
          sx: {
            borderRadius: "8px",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: payload.backdropColor ?? "rgba(0, 0, 0, 0.5)",
          },
        },
        root: {
          "aria-describedby": "alert-dialog-description",
        },
      }}
      aria-describedby={payload.ariaDescribedby ?? "alert-dialog-description"}
      closeAfterTransition={true}
    >
      <DialogTitle
        color={payload.severity}
        sx={{
          background:
            "linear-gradient(90deg,rgba(96, 7, 40, 0.1) 0%, rgba(255, 170, 51, 0.1) 73%)",
        }}
      >
        {payload.title ?? "Alert"}
        <IconButton
          aria-label="close"
          onClick={() => {
            void onClose()
            document
              .getElementById("root")
              ?.setAttribute("aria-hidden", "false")
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{ width: "100%", padding: 0, margin: 0 }}
        id={payload.ariaDescribedby ?? "alert-dialog-description"}
      >
        {payload.msg}
      </DialogContent>
      {/* <DialogActions>
        <Button disabled={!open} variant='outlined' {...okButtonProps}>
          {payload.okText ?? 'Ok'}
        </Button>
      </DialogActions> */}
    </Dialog>
  )
}

ContentDialog.propTypes = {
  /**
   * A function to call when the dialog should be closed. If the dialog has a return  value, it should be passed as an argument to this function. You should use the promise
   * that is returned to show a loading state while the dialog is performing async actions
   * on close.
   * @param result The result to return from the dialog.
   * @returns A promise that resolves when the dialog can be fully closed.
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Whether the dialog is open.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The payload that was passed when the dialog was opened.
   */
  payload: PropTypes.shape({
    cancelText: PropTypes.node,
    msg: PropTypes.node,
    okText: PropTypes.node,
    onClose: PropTypes.func,
    severity: PropTypes.oneOf(["error", "info", "success", "warning"]),
    transitionDirection: PropTypes.oneOf(["up", "down", "left", "right"]),
    width: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    title: PropTypes.node,
    ariaDescribedby: PropTypes.string,
  }).isRequired,
}
