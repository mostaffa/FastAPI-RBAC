import React, { useEffect } from "react"
import CssBaseline from "@mui/material/CssBaseline"
import Loader from "./components/ui/loader/Loader"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { selectUser, setUser } from "./features/user/userSlice"
import { AuthService } from "./api"
// import { SocketProvider } from "./hooks/useSocket/SocketProvider";

const AppTheme = React.lazy(() => import("./theme/AppTheme"))
const DialogsProvider = React.lazy(
  () => import("./hooks/useDialogs/DialogsProvider"),
)
const NotificationsProvider = React.lazy(
  () => import("./hooks/useNotifications/NotificationsProvider"),
)
const AppRouter = React.lazy(() => import("./routers/AppRouter"))
const Signin = React.lazy(() => import("./pages/signin/SignIn"))
const SocketProvider = React.lazy(
  () => import("./hooks/useSocket/SocketProvider"),
)

export const App = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)

  useEffect(() => {
    if (!user) {
      AuthService.readCurrentUserApiV1AuthMeGet()
        .then(userData => {
          dispatch(setUser(userData))
        })
        .catch((error: unknown) => {
          // No current user
          console.log("No current user:", error)
        })
    }
  }, [user, dispatch])
  return (
    <React.Suspense fallback={<Loader />}>
      <AppTheme>
        <CssBaseline enableColorScheme />

        <React.Suspense fallback={<Loader />}>
          <NotificationsProvider>
            <React.Suspense fallback={<Loader />}>
              <DialogsProvider>
                <React.Suspense fallback={<Loader />}>
                  <SocketProvider>
                    {user ? (
                      <AppRouter />
                    ) : (
                      <React.Suspense fallback={<Loader />}>
                        <Signin />
                      </React.Suspense>
                    )}
                  </SocketProvider>
                </React.Suspense>
              </DialogsProvider>
            </React.Suspense>
          </NotificationsProvider>
        </React.Suspense>
      </AppTheme>
    </React.Suspense>
  )
}

export default App
