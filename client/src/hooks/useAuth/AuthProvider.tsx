import type { UserOut } from "@/api"
import { ApiError, AuthService } from "@/api"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import {
  setUser,
  clearUser,
  addPermission,
  removePermission,
  selectPermissions,
} from "@/features/user/userSlice"
import { AuthContext } from "./AuthContext"
import { useState, useEffect } from "react"

type AuthProviderProps = {
  children: React.ReactNode
}

const isUnAuthorizedError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 401
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.user.user)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = await AuthService.loginApiV1AuthLoginPost({
        formData: { username, password },
      })
      dispatch(setUser(loggedInUser.user))
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AuthService.logoutApiV1AuthLogoutPost()
      dispatch(clearUser())
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  const addPerm = (permission: string) => {
    // if (user) {
    dispatch(addPermission(permission))
    // }
  }

  const removePerm = (permission: string) => {
    // if (user) {
    dispatch(removePermission(permission))
    // }
  }

  const getPermissions = useAppSelector(selectPermissions)
  const setCurrentUser = (user: UserOut | null) => {
    dispatch(setUser(user))
  }

  useEffect(() => {
    void (async () => {
      try {
        const currentUser = await AuthService.readCurrentUserApiV1AuthMeGet()
        dispatch(setUser(currentUser))
      } catch (error) {
        if (isUnAuthorizedError(error)) {
          dispatch(clearUser())
        } else {
          console.error(error)
        }
      } finally {
        setIsInitializing(false)
      }
    })()
    return () => {
      dispatch(clearUser())
    }
  }, [dispatch, setIsInitializing])

  if (isInitializing) {
    return <div>Loading...</div>
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        addPerm,
        removePerm,
        getPermissions,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
