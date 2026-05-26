import type { UserOut } from "@/api"
import { createContext } from "react"

export type AuthContextType = {
  user: UserOut | null
  setCurrentUser: (user: UserOut | null) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  addPerm: (permission: string) => void
  removePerm: (permission: string) => void
  getPermissions: string[] | undefined
}

export const AuthContext = createContext<AuthContextType | null>(null)
