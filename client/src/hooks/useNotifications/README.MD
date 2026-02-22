# useNotifications Hook & NotificationsProvider

Promise-free, key-based API for showing queued MUI snackbars/alerts with optional actions, severity, auto-hide, and deduplication.

## Quick Start

1. Wrap your app (near the root) with `NotificationsProvider`.
2. Call `useNotifications()` in any descendant component.
3. Use `show(message, options?)` to display a notification. Optionally close it early with `close(key)`.

```tsx
// src/main.tsx (example)
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import NotificationsProvider from "../hooks/useNotifications/NotificationsProvider"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotificationsProvider>
      <App />
    </NotificationsProvider>
  </React.StrictMode>,
)
```

## API Overview

`useNotifications()` returns:

| Method                    | Description                                   | Returns      |
| ------------------------- | --------------------------------------------- | ------------ |
| `show(message, options?)` | Enqueue a notification (shows first in queue) | `string` key |
| `close(key)`              | Remove a notification by key                  | `void`       |

### Options (`ShowNotificationOptions`)

| Option             | Type         | Description                                                                                     |
| ------------------ | ------------ | ----------------------------------------------------------------------------------------------- | ------- | ---------- | -------------------------------------------------------- |
| `key`              | `string`     | Manual key for deduping (auto-generated if omitted).                                            |
| `severity`         | `'info'      | 'warning'                                                                                       | 'error' | 'success'` | If set, wraps message in `<Alert>` with severity styles. |
| `autoHideDuration` | `number`     | Milliseconds before auto close. Leave undefined to keep open until manual close/action/timeout. |
| `actionText`       | `ReactNode`  | Label for optional action button. Defaults to `'Action'` if `onAction` provided.                |
| `onAction`         | `() => void` | Callback invoked when action button clicked (does not auto close unless you call `close`).      |

## Basic Examples

### Simple Info Notification

```tsx
const { show } = useNotifications()
show("Profile saved")
```

### Success Notification With Auto Hide

```tsx
show("Settings updated", { severity: "success", autoHideDuration: 3000 })
```

### Action Button

```tsx
const key = show("Failed to sync. Retry?", {
  severity: "error",
  actionText: "Retry",
  onAction: () => {
    retrySync()
    // Optionally close after action
    // close(key)
  },
})
```

### Manual Close

```tsx
const { show, close } = useNotifications()
const key = show("Uploading large file…")
// Later when finished
close(key)
show("Upload complete", { severity: "success", autoHideDuration: 2500 })
```

### Deduplication

If you provide the same `key`, subsequent `show` calls are ignored until closed.

```tsx
show("Still working…", { key: "loader", severity: "info" })
show("Still working…", { key: "loader", severity: "info" }) // ignored
```

## Queue Behavior

- Only the first (oldest) queued notification is visible.
- Remaining queue length is shown as a numeric badge above the snackbar when more than one is pending.
- When the visible notification closes, the next queue entry becomes visible.

## Closing Rules

- Auto hide triggers `close(key)` internally after `autoHideDuration`.
- Clicking backdrop (clickaway) is ignored to prevent accidental dismissal.
- Close icon always closes.
- If you want action button to close, call `close(key)` inside `onAction`.

## Severity vs Plain Snackbar

- Without `severity`, content renders inside `SnackbarContent`.
- With `severity`, content renders inside `Alert severity={...}` (still wrapped by `Snackbar`).

## Advanced Patterns

### Replace Current Notification

```tsx
// Close existing then show a new one
close(currentKey)
const newKey = show("Reconnected", {
  severity: "success",
  autoHideDuration: 2000,
})
```

### Progress Simulation

```tsx
const key = show("Processing (step 1/3)…", { key: "process" })
setTimeout(() => show("Processing (step 2/3)…", { key: "process" }), 1000)
setTimeout(() => show("Processing (step 3/3)…", { key: "process" }), 2000)
setTimeout(() => {
  close("process")
  show("Done", { severity: "success", autoHideDuration: 1500 })
}, 3000)
```

### Global Helper Wrapper

You can export a tiny helper (e.g. in `src/utils/notify.ts`) with predefined severities:

```tsx
// notify.ts
import useNotifications from "../hooks/useNotifications/useNotifications"
export function useNotify() {
  const { show } = useNotifications()
  return {
    success: (m: React.ReactNode) =>
      show(m, { severity: "success", autoHideDuration: 2500 }),
    error: (m: React.ReactNode) => show(m, { severity: "error" }),
    info: (m: React.ReactNode) =>
      show(m, { severity: "info", autoHideDuration: 3000 }),
  }
}
```

## Error Handling & Pitfalls

| Issue                         | Cause                                          | Fix                                                     |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Duplicate spam                | Same message queued fast                       | Provide stable `key` to dedupe                          |
| Stale action closure          | Using state outside effect                     | Use function refs or up-to-date state inside `onAction` |
| Notification persists forever | Missing `autoHideDuration` and no manual close | Add duration or call `close(key)`                       |

## Testing

In tests, wrap components with `NotificationsProvider` and assert on snackbar content.

```tsx
// Example (React Testing Library pseudo)
render(
  <NotificationsProvider>
    <ComponentUnderTest />
  </NotificationsProvider>,
)
expect(screen.queryByText("Profile saved")).toBeNull()
act(() => show("Profile saved"))
expect(screen.getByText("Profile saved")).toBeInTheDocument()
```

## Design Notes

- Stateless API: `show` returns a key; you manage lifecycle externally as needed.
- Queue ensures a single focus target for accessibility.
- Badge communicates pending notifications count without overwhelming the user.

## Extensibility Ideas

- Add priority handling (insert at front of queue).
- Add `variant` prop for different layouts (e.g., compact vs full).
- Integrate with logging/telemetry inside `show` wrapper.

---

The pattern is intentionally minimal; adapt to fit your app’s UX needs.
