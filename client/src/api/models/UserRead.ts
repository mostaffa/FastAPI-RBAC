/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */

import type { RoleRead } from "./RoleRead"
/**
 * Docstring for UserRead
 * Schema for reading user information.
 */
export type UserRead = {
  id: number
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  active: boolean
  role?: RoleRead | null
}
