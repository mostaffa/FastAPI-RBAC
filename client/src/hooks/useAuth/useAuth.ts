import type { UserOut } from "@/api"
import { AuthContext } from "./AuthContext"
import { useContext } from "react"

type UseAuthReturnType = {
  user: UserOut | null
  setCurrentUser: (user: UserOut | null) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  addPerm: (permission: string) => void
  removePerm: (permission: string) => void
  getPermissions: string[] | undefined
}

export const useAuth = (): UseAuthReturnType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
