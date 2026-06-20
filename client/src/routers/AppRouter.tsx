import { BASE_URL, DASHBOARD_URL } from "@/utils/constants"
import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"

const Signin = lazy(() => import("@/pages/signin/SignIn"))
const Signup = lazy(() => import("@/pages/signup/SignUp"))
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"))
const Loader = lazy(() => import("@/components/ui/loader/Loader"))
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"))

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path={`${BASE_URL}signin`}
        element={
          <Suspense fallback={<Loader />}>
            <Signin />
          </Suspense>
        }
      />
      <Route
        path={`${BASE_URL}signup`}
        element={
          <Suspense fallback={<Loader />}>
            <Signup />
          </Suspense>
        }
      />
      <Route
        path={BASE_URL}
        element={
          <Suspense fallback={<Loader />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route
        path={`${BASE_URL}${DASHBOARD_URL}*`}
        element={
          <Suspense fallback={<Loader />}>
            <Dashboard />
          </Suspense>
        }
      />
    </Routes>
  )
}
