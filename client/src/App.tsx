import { lazy, Suspense } from "react"
import { useAuth } from "./hooks/useAuth/useAuth"

const CssBaseline = lazy(() => import("@mui/material/CssBaseline"))
const Loader = lazy(() => import("@/components/ui/loader/Loader"))
const AppTheme = lazy(() => import("./theme/AppTheme"))
const DialogsProvider = lazy(() => import("./hooks/useDialogs/DialogsProvider"))
const NotificationsProvider = lazy(
  () => import("./hooks/useNotifications/NotificationsProvider"),
)
const AppRouter = lazy(() => import("./routers/AppRouter"))
const Signin = lazy(() => import("./pages/signin/SignIn"))
const SocketProvider = lazy(() => import("./hooks/useSocket/SocketProvider"))

export const App = () => {
  const { user } = useAuth()

  return (
    <Suspense fallback={<Loader />}>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <NotificationsProvider>
          <DialogsProvider>
            <SocketProvider>
              {user ? (
                <Suspense fallback={<Loader />}>
                  <AppRouter />
                </Suspense>
              ) : (
                <Suspense fallback={<Loader />}>
                  <Signin />
                </Suspense>
              )}
            </SocketProvider>
          </DialogsProvider>
        </NotificationsProvider>
      </AppTheme>
    </Suspense>
  )
}

export default App
