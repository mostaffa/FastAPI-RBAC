// client/src/hooks/useAuth/AuthProvider.tsx
// This file provides authentication context for the entire application.
// It manages user login, logout, permission management, and initializes the user state.

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

// NOTE: This provider should wrap the app at a high level (e.g. in main.tsx)
// so that authentication state is available to all child components.

// Type definition for the AuthProvider component props
type AuthProviderProps = {
  children: React.ReactNode
}

// Helper function to check if an error is an unauthorized error (401 status)
const isUnAuthorizedError = (error: unknown): error is ApiError => {
  return error instanceof ApiError && error.status === 401
}

/**
 * AuthProvider component provides authentication context throughout the app.
 * It manages user state, handles login/logout, and exposes authentication-related functions.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get the dispatch and user state from the Redux store
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.user.user) // Current user state

  // State to track if the app is initializing (loading user data)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  /**
   * Login function handles user authentication.
   * @param username - The username for login
   * @param password - The password for login
   */
  const login = async (username: string, password: string) => {
    try {
      // Call the API to login
      const loggedInUser = await AuthService.loginApiV1AuthLoginPost({
        formData: { username, password },
      })
      // Dispatch user update to Redux store
      dispatch(setUser(loggedInUser.user))
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  /**
   * Logout function handles user logout.
   * Clears the user state from Redux store and calls API.
   */
  const logout = async () => {
    try {
      // Call API to logout
      await AuthService.logoutApiV1AuthLogoutPost()
      // Clear user state from Redux store
      dispatch(clearUser())
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    }
  }

  /**
   * AddPermission function adds a permission to the current user.
   * @param permission - The permission to add
   */
  const addPerm = (permission: string) => {
    // Dispatch permission update to Redux store
    dispatch(addPermission(permission))
  }

  /**
   * RemovePermission function removes a permission from the current user.
   * @param permission - The permission to remove
   */
  const removePerm = (permission: string) => {
    // Dispatch permission update to Redux store
    dispatch(removePermission(permission))
  }

  // Get current permissions from Redux store
  const getPermissions = useAppSelector(selectPermissions)

  /**
   * setCurrentUser function updates the current user in Redux store.
   * @param user - The new user object or null
   */
  const setCurrentUser = (user: UserOut | null) => {
    dispatch(setUser(user))
  }

  // Effect to initialize user state when component mounts
  useEffect(() => {
    void (async () => {
      try {
        // Try to fetch current user
        const currentUser = await AuthService.readCurrentUserApiV1AuthMeGet()
        dispatch(setUser(currentUser)) // Set current user in Redux
      } catch (error) {
        // If error is unauthorized, clear user state
        if (isUnAuthorizedError(error)) {
          dispatch(clearUser())
        } else {
          console.error(error) // Log other errors
        }
      } finally {
        // Set isInitializing to false after initialization
        setIsInitializing(false)
      }
    })()

    // Cleanup function to clear user state when component unmounts
    return () => {
      dispatch(clearUser())
    }
  }, [dispatch, setIsInitializing])

  // Show loading state while initializing
  if (isInitializing) {
    return <div>Loading...</div>
  }

  // Return the AuthContext.Provider with authentication functions
  return (
    <AuthContext.Provider
      value={{
        user, // Current user state
        login, // Login function
        logout, // Logout function
        addPerm, // Add permission function
        removePerm, // Remove permission function
        getPermissions, // Current permissions
        setCurrentUser, // Set current user function
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
