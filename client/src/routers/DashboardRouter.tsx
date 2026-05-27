import React from "react"
import { Routes, Route } from "react-router"
import Loader from "@/components/ui/loader/Loader"
// import { useAppSelector } from "../app/hooks"
// import { selectUser, selectPermissions } from "../features/user/userSlice"
import { useAuth } from "@/hooks/useAuth/useAuth"

const Layout = React.lazy(() => import("@/pages/dashboard/layout/Layout"))
const MainView = React.lazy(() => import("@/pages/dashboard/main/MainView"))
const Dialogs = React.lazy(
  () => import("@/pages/dashboard/notifications/Dialogs"),
)
const NotificationAlerts = React.lazy(
  () => import("@/pages/dashboard/notifications/NotificationAlerts"),
)

const Roles = React.lazy(() => import("@/pages/dashboard/admin/roles/Roles"))
const Users = React.lazy(() => import("@/pages/dashboard/admin/users/Users"))
const UserForm = React.lazy(
  () => import("@/pages/dashboard/admin/users/UserForm"),
)
const Sensors = React.lazy(() => import("@/pages/dashboard/sensor/Sensor"))
const Manage = React.lazy(() => import("@/pages/dashboard/manage"))
const Temperature = React.lazy(
  () => import("@/pages/dashboard/manage/monitoring"),
)
const Memory = React.lazy(
  () => import("@/pages/dashboard/manage/monitoring/Memory"),
)
const Cpu = React.lazy(() => import("@/pages/dashboard/manage/monitoring/Cpu"))
const Disk = React.lazy(
  () => import("@/pages/dashboard/manage/monitoring/Disk"),
)
const SystemInfo = React.lazy(
  () => import("@/pages/dashboard/sensors/SystemInfo"),
)

export default function DashboardRouter() {
  // const user = useAppSelector(selectUser)
  const { user, getPermissions } = useAuth()
  const permissions = getPermissions
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
      {permissions?.includes("role:read") || user?.user.role?.id === 1 ? (
        <Route
          path="/admin/roles"
          element={
            <React.Suspense fallback={<Loader />}>
              <Roles />
            </React.Suspense>
          }
        />
      ) : null}
      {permissions?.includes("user:read") || user?.user.role?.id === 1 ? (
        <Route
          path="/admin/users"
          element={
            <React.Suspense fallback={<Loader />}>
              <Users />
            </React.Suspense>
          }
        />
      ) : null}
      {permissions?.includes("terminal:read") || user?.user.role?.id === 1 ? (
        <>
          <Route
            path="/manage/*"
            element={
              <React.Suspense fallback={<Loader />}>
                <Manage />
              </React.Suspense>
            }
          />
        </>
      ) : null}
      {permissions?.includes("sensors:read") || user?.user.role?.id === 1 ? (
        <>
          <Route
            path="/manage/system"
            element={
              <React.Suspense fallback={<Loader />}>
                <SystemInfo />
              </React.Suspense>
            }
          />
          <Route
            path="/manage/temperature"
            element={
              <React.Suspense fallback={<Loader />}>
                <Temperature />
              </React.Suspense>
            }
          />
          <Route
            path="/manage/memory"
            element={
              <React.Suspense fallback={<Loader />}>
                <Memory />
              </React.Suspense>
            }
          />
          <Route
            path="/manage/cpu"
            element={
              <React.Suspense fallback={<Loader />}>
                <Cpu />
              </React.Suspense>
            }
          />
          <Route
            path="/manage/disk"
            element={
              <React.Suspense fallback={<Loader />}>
                <Disk />
              </React.Suspense>
            }
          />
        </>
      ) : null}
    </Routes>
  )
}
