/**
 * useAuth - Custom React Hook for Authentication Context Access
 *
 * A wrapper around the AuthContext that provides type-safe access to authentication state
 * and actions throughout your React application. This hook enforces the requirement that
 * authentication logic must be used within an AuthProvider component, throwing a descriptive
 * error if misused.
 *
 * @description
 * This hook is the primary interface for accessing authentication-related data and functions
 * in any React component or custom hook. It provides:
 * - Current user information (profile, roles, permissions)
 * - Authentication actions (login, logout)
 * - Permission management utilities (add/remove/check permissions)
 *
 * @requires AuthProvider - Must be wrapped within <AuthProvider> in the component tree
 * @throws Error if used outside of AuthProvider context
 *
 * @example
 * ```tsx
 * // Basic usage in a component
 * function UserProfile() {
 *   const { user, logout } = useAuth();
 *
 *   if (!user) return <p>Please log in</p>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.username}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using permissions for conditional rendering
 * function AdminPanel() {
 *   const { getPermissions } = useAuth();
 *   const hasAdminAccess = getPermissions?.includes('admin:manage') ?? false;
 *
 *   if (!hasAdminAccess) return <p>Access denied</p>;
 *   return <AdminDashboard />;
 * }
 * ```
 */

// Import the user output type from the API models for type-safe user data
import type { UserOut } from "@/api"

// Import the AuthContext to access authentication state and actions
import { AuthContext } from "./AuthContext"

// React's useContext hook to consume the context value
import { useContext } from "react"

/**
 * Return type for the useAuth hook.
 * Defines all available authentication methods and state properties.
 */
type UseAuthReturnType = {
  /** Current authenticated user object, or null if no user is logged in */
  user: UserOut | null

  /** Update the current user in state. Pass null to clear the user session */
  setCurrentUser: (user: UserOut | null) => void

  /** Authenticate a user with username and password credentials */
  login: (username: string, password: string) => Promise<void>

  /** End the current session and clear authentication state */
  logout: () => Promise<void>

  /** Add a permission string to the current user's permissions list */
  addPerm: (permission: string) => void

  /** Remove a permission string from the current user's permissions list */
  removePerm: (permission: string) => void

  /** Array of current user's permissions, or undefined if not yet loaded */
  getPermissions: string[] | undefined
}

/**
 * Custom hook to access the authentication context.
 * Provides user info, login/logout actions, and permission management.
 * Must be used within an AuthProvider component.
 */
export const useAuth = (): UseAuthReturnType => {
  // Retrieve the authentication context value from React's context API
  const context = useContext(AuthContext)

  // Guard clause: ensure this hook is used within an AuthProvider
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  // Return the full authentication context with all its methods and state
  return context
}
