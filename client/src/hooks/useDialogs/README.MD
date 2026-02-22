# useDialogs Hook & DialogsProvider

Lightweight promise-based API for showing MUI dialogs (alert, confirm, prompt) and custom dialogs, with async close handling and automatic stacking.

## Quick Start

1. Wrap your app (near the root) with `DialogsProvider`.
2. Call the hook `useDialogs()` inside any descendant component.
3. Use `alert`, `confirm`, `prompt`, or `open` for custom dialogs.

```tsx
// src/main.tsx (example)
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import DialogsProvider from "../hooks/useDialogs/DialogsProvider"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DialogsProvider>
      <App />
    </DialogsProvider>
  </React.StrictMode>,
)
```

## API Overview

`useDialogs()` returns:

| Method                                | Description                                 | Returns                                 |
| ------------------------------------- | ------------------------------------------- | --------------------------------------- | ------ |
| `alert(msg, options?)`                | Simple acknowledge dialog                   | `Promise<void>`                         |
| `confirm(msg, options?)`              | Yes/No dialog                               | `Promise<boolean>` (true = Ok)          |
| `prompt(msg, options?)`               | Text input dialog                           | `Promise<string                         | null>` |
| `open(Component, payload?, options?)` | Custom dialog                               | `Promise<R>` where `R` is dialog result |
| `close(dialogPromise, result)`        | Imperatively close previously opened dialog | `Promise<R>`                            |

### Option Objects

All built-ins (`alert`, `confirm`, `prompt`) accept a message plus an options object:

Common options:

- `title?: ReactNode`
- `okText?: ReactNode`
- `cancelText?: ReactNode` (confirm & prompt)
- `severity?: 'error' | 'info' | 'success' | 'warning'` (confirm only)
- `onClose?: (result) => Promise<void>` — async action before closing (e.g. server call). While this promise is pending the dialog stays open; you can show loading state using internal patterns.

## Basic Examples

### Alert

```tsx
const { alert } = useDialogs()

async function handleDeleteSuccess() {
  await alert("Record deleted successfully.", {
    title: "Success",
    okText: "Got it",
  })
}
```

### Confirm

```tsx
const { confirm } = useDialogs()

async function handleDangerousAction() {
  const ok = await confirm("This cannot be undone. Continue?", {
    title: "Delete Item",
    severity: "error",
    okText: "Delete",
    cancelText: "Keep",
  })
  if (ok) {
    // proceed
  }
}
```

### Prompt

```tsx
const { prompt } = useDialogs()

async function rename() {
  const newName = await prompt("Enter a new name:", {
    title: "Rename",
    okText: "Save",
    cancelText: "Cancel",
  })
  if (newName !== null) {
    // use newName
  }
}
```

### Async Close (loading state)

You can run async work before the dialog actually closes using `onClose`:

```tsx
const { confirm } = useDialogs()

async function archive(id: string) {
  const result = await confirm("Archive this record?", {
    title: "Archive",
    okText: "Archive",
    onClose: async ok => {
      if (ok) {
        // Wait for server call before dialog disappears
        await fetch(`/api/archive/${id}`, { method: "POST" })
      }
    },
  })
  if (result) {
    // archived
  }
}
```

Internally buttons use a helper to show a `loading` flag while awaiting `onClose`. If you want a spinner, change to `@mui/lab/LoadingButton` or add a `CircularProgress` manually.

## Custom Dialogs

Define a dialog component implementing `DialogProps<P, R>` where `P` is payload type and `R` is result type.

```tsx
// CustomConfirm.tsx
import { DialogProps } from "./useDialogs"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material"

export type CustomConfirmPayload = {
  question: string
  emphasis?: "info" | "error"
}

export function CustomConfirmDialog({
  open,
  payload,
  onClose,
}: DialogProps<CustomConfirmPayload, boolean>) {
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      onClose={() => {
        void onClose(false)
      }}
    >
      <DialogTitle>
        {payload.emphasis === "error" ? "⚠️ " : ""}
        {payload.question}
      </DialogTitle>
      <DialogContent>Answer the question above.</DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            void onClose(false)
          }}
        >
          No
        </Button>
        <Button
          color={payload.emphasis}
          onClick={() => {
            void onClose(true)
          }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

Open it:

```tsx
const { open } = useDialogs()

async function ask() {
  const accepted = await open(CustomConfirmDialog, {
    question: "Enable feature?",
    emphasis: "info",
  })
  if (accepted) {
    // proceed
  }
}
```

### Payload & Result Typing

`open(CustomConfirmDialog, payload)` returns a typed `Promise<boolean>` inferred from the component's `DialogProps<Payload, Result>`.

### Imperative Close

You receive the dialog promise immediately and may close programmatically:

```tsx
const { open, close } = useDialogs()

async function showThenAutoClose() {
  const dlg = open(CustomConfirmDialog, {
    question: "Wait 3s then auto close?",
  })
  setTimeout(() => {
    void close(dlg, true)
  }, 3000)
  const confirmed = await dlg
  // confirmed === true (forced)
}
```

## Stacking Behavior

Multiple dialogs can be opened sequentially; they are rendered in request order. Each maintains its own promise. Closing one does not affect others.

## Accessibility Notes

The implementation sets `aria-hidden="false"` on `#root` when dialogs close; ensure other layers do not conflict. MUI manages focus trapping automatically.

## Error Handling

- If you call `close` with an unknown promise, an error is thrown (internal safety).
- If form extraction fails in `PromptDialog` (non-string value), an error is thrown to prevent invalid state.

## Best Practices

- Keep `onClose` side effects minimal; heavy work should happen after resolving unless you must block closing.
- Avoid mutating global state during render; only call `onClose` in event handlers / `onClose` prop.
- Debounce or guard repeated `confirm` calls if user could trigger many quickly.

## Type Reference (Key Generics)

```ts
type DialogComponent<P, R> = React.ComponentType<DialogProps<P, R>>
type OpenDialog = {
  <P extends undefined, R>(
    Component: DialogComponent<P, R>,
    payload?: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>
  <P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>
}
```

## Migration / Common Pitfalls

| Issue                              | Cause                                       | Fix                                                      |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Dialog opens then freezes          | Calling `onClose` immediately during render | Pass a function to `onClose` instead of invoking         |
| `loading` prop warning on `Button` | MUI `Button` lacks `loading`                | Use `LoadingButton` or replace with `disabled={loading}` |
| Dialog never closes                | `onClose` promise never resolves            | Ensure async path resolves or catches errors             |

## Testing

For unit tests, you can mock dialogs by wrapping test trees with `DialogsProvider` and spying on methods returned by `useDialogs()`. Since return values are promises, you can `await` them directly in Jest or React Testing Library flows.

```tsx
// Example pseudo test
const { alert } = useDialogs()
await act(async () => {
  await alert("Test")
})
```

---

Feel free to extend built-ins or remove ones you don't need. The pattern is intentionally small and framework-agnostic beyond MUI.
