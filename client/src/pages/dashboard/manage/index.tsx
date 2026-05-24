import React from "react"
import { Routes, Route } from "react-router"
import { useAppSelector } from "../../../app/hooks"
import { selectPermissions } from "../../../features/user/userSlice"
import Loader from "../../../components/ui/loader/Loader"

const Console = React.lazy(() => import("./console"))

export default function Manage() {
  const permissions = useAppSelector(selectPermissions)

  return (
    <Routes>
      {permissions?.includes("terminal:read") ? (
        <Route
          path="/terminal"
          element={
            <React.Suspense fallback={<Loader />}>
              <Console />
            </React.Suspense>
          }
        />
      ) : null}
    </Routes>
  )
}
