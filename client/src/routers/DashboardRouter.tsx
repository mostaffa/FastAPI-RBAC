import React from "react"
import { Routes, Route } from "react-router"
import Loader from "../components/ui/loader/Loader"
import { useAppSelector } from "../app/hooks"
import { selectUser, selectPermissions } from "../features/user/userSlice"

const Layout = React.lazy(() => import("../pages/dashboard/layout/Layout"))
const MainView = React.lazy(() => import("../pages/dashboard/main/MainView"))
const Dialogs = React.lazy(
  () => import("../pages/dashboard/notifications/Dialogs"),
)
const NotificationAlerts = React.lazy(
  () => import("../pages/dashboard/notifications/NotificationAlerts"),
)

const Roles = React.lazy(() => import("../pages/dashboard/admin/roles/Roles"))
const Users = React.lazy(() => import("../pages/dashboard/admin/users/Users"))
const UserForm = React.lazy(
  () => import("../pages/dashboard/admin/users/UserForm"),
)
const Sensors = React.lazy(() => import("../pages/dashboard/sensor/Sensor"))
const Manage = React.lazy(() => import("../pages/dashboard/manage"))
const Status = React.lazy(() => import("../pages/dashboard/manage/status"))

export default function DashboardRouter() {
  const user = useAppSelector(selectUser)
  const permissions = useAppSelector(selectPermissions)
  return (
    <Routes>
      <Route
        path="/me"
        element={
          <React.Suspense fallback={<Loader />}>
            <UserForm updateCurrentUser />
          </React.Suspense>
        }
      />
      <Route
        path="/layout"
        element={
          <React.Suspense fallback={<Loader />}>
            <Layout />
          </React.Suspense>
        }
      />
      <Route
        path="/sensors"
        element={
          <React.Suspense fallback={<Loader />}>
            <Sensors />
          </React.Suspense>
        }
      />
      <Route
        path="/notifications/dialogs"
        element={
          <React.Suspense fallback={<Loader />}>
            <Dialogs />
          </React.Suspense>
        }
      />
      <Route
        path="/notifications/alerts"
        element={
          <React.Suspense fallback={<Loader />}>
            <NotificationAlerts />
          </React.Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <React.Suspense fallback={<Loader />}>
            <MainView />
          </React.Suspense>
        }
      />
      {permissions?.includes("role:read") || user?.role?.id === 1 ? (
        <Route
          path="/admin/roles"
          element={
            <React.Suspense fallback={<Loader />}>
              <Roles />
            </React.Suspense>
          }
        />
      ) : null}
      {permissions?.includes("user:read") || user?.role?.id === 1 ? (
        <Route
          path="/admin/users"
          element={
            <React.Suspense fallback={<Loader />}>
              <Users />
            </React.Suspense>
          }
        />
      ) : null}
      {permissions?.includes("terminal:read") || user?.role?.id === 1 ? (
        <>
          <Route
            path="/manage/*"
            element={
              <React.Suspense fallback={<Loader />}>
                <Manage />
              </React.Suspense>
            }
          />
          <Route
            path="/manage/status"
            element={
              <React.Suspense fallback={<Loader />}>
                <Status />
              </React.Suspense>
            }
          />
        </>
      ) : null}
    </Routes>
  )
}
