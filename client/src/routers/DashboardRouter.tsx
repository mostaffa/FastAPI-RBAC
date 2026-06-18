import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router"
import { useAuth } from "@/hooks/useAuth/useAuth"

const Loader = lazy(() => import("@/components/ui/loader/Loader"))
const Dialogs = lazy(() => import("@/pages/dashboard/notifications/Dialogs"))
const NotificationAlerts = lazy(
  () => import("@/pages/dashboard/notifications/NotificationAlerts"),
)

const Roles = lazy(() => import("@/pages/dashboard/admin/roles/Roles"))
const Users = lazy(() => import("@/pages/dashboard/admin/users/Users"))
const UserForm = lazy(() => import("@/pages/dashboard/admin/users/UserForm"))
const Sensors = lazy(() => import("@/pages/dashboard/sensor/Sensor"))
const Temperature = lazy(() => import("@/pages/dashboard/monitoring"))
const Memory = lazy(() => import("@/pages/dashboard/monitoring/Memory"))
const Cpu = lazy(() => import("@/pages/dashboard/monitoring/Cpu"))
const Disk = lazy(() => import("@/pages/dashboard/monitoring/Disk"))
const Services = lazy(() => import("@/pages/dashboard/services/Services"))
const SystemInfo = lazy(() => import("@/pages/dashboard/monitoring/SystemInfo"))
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"))

export default function DashboardRouter() {
  // const user = useAppSelector(selectUser)
  const { user, getPermissions } = useAuth()
  const permissions = getPermissions
  return (
    <Routes>
      <Route
        path="/me"
        element={
          <Suspense fallback={<Loader />}>
            <UserForm updateCurrentUser />
          </Suspense>
        }
      />
      <Route
        path="/sensors"
        element={
          <Suspense fallback={<Loader />}>
            <Sensors />
          </Suspense>
        }
      />
      <Route
        path="/notifications/dialogs"
        element={
          <Suspense fallback={<Loader />}>
            <Dialogs />
          </Suspense>
        }
      />
      <Route
        path="/notifications/alerts"
        element={
          <Suspense fallback={<Loader />}>
            <NotificationAlerts />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <Suspense fallback={<Loader />}>
            <LandingPage />
          </Suspense>
        }
      />
      {permissions?.includes("role:read") || user?.user.role?.id === 1 ? (
        <Route
          path="/admin/roles"
          element={
            <Suspense fallback={<Loader />}>
              <Roles />
            </Suspense>
          }
        />
      ) : null}
      {permissions?.includes("user:read") || user?.user.role?.id === 1 ? (
        <Route
          path="/admin/users"
          element={
            <Suspense fallback={<Loader />}>
              <Users />
            </Suspense>
          }
        />
      ) : null}
      {permissions?.includes("sensors:read") || user?.user.role?.id === 1 ? (
        <>
          <Route
            path="/manage/system"
            element={
              <Suspense fallback={<Loader />}>
                <SystemInfo />
              </Suspense>
            }
          />
          <Route
            path="/manage/temperature"
            element={
              <Suspense fallback={<Loader />}>
                <Temperature />
              </Suspense>
            }
          />
          <Route
            path="/manage/memory"
            element={
              <Suspense fallback={<Loader />}>
                <Memory />
              </Suspense>
            }
          />
          <Route
            path="/manage/cpu"
            element={
              <Suspense fallback={<Loader />}>
                <Cpu />
              </Suspense>
            }
          />
          <Route
            path="/manage/disk"
            element={
              <Suspense fallback={<Loader />}>
                <Disk />
              </Suspense>
            }
          />
        </>
      ) : null}
      {permissions?.includes("services:read") || user?.user.role?.id === 1 ? (
        <Route
          path="/services"
          element={
            <Suspense fallback={<Loader />}>
              <Services />
            </Suspense>
          }
        />
      ) : null}
    </Routes>
  )
}
