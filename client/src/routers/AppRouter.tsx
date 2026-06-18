import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router"

const Signin = lazy(() => import("@/pages/signin/SignIn"))
const Signup = lazy(() => import("@/pages/signup/SignUp"))
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"))
const Loader = lazy(() => import("@/components/ui/loader/Loader"))

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/signin"
        element={
          <Suspense fallback={<Loader />}>
            <Signin />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<Loader />}>
            <Signup />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <Suspense fallback={<Loader />}>
            <Dashboard />
          </Suspense>
        }
      />
    </Routes>
  )
}
