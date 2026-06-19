// AuthContext.ts
// This file defines the context for authentication state and related functions in the application.

// Importing types from the API layer
import type { UserOut } from "@/api"
// Importing React's createContext function to create a context object
import { createContext } from "react"

// Type definition for the AuthContext, which holds authentication state and functions
export type AuthContextType = {
  user: UserOut | null // Current authenticated user or null if not logged in
  setCurrentUser: (user: UserOut | null) => void // Function to update the current user
  login: (username: string, password: string) => Promise<void> // Function to handle login process
  logout: () => Promise<void> // Function to handle logout process
  addPerm: (permission: string) => void // Function to add a permission to the user
  removePerm: (permission: string) => void // Function to remove a permission from the user
  getPermissions: string[] | undefined // Getter for the user's permissions
}

// Creating an AuthContext instance with initial value of null
export const AuthContext = createContext<AuthContextType | null>(null)
