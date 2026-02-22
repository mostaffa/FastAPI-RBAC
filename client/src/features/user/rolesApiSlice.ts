import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RoleRead, PermissionRead } from "../../api"
import { RolesService } from "../../api/services/RolesService"

export const rolesApiSlice = createApi({
  reducerPath: "rolesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["Roles"],
  endpoints: builder => ({
    getRoles: builder.query<RoleRead[], undefined>({
      async queryFn() {
        try {
          const data = await RolesService.readRolesApiV1RolesGet()
          return { data }
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              data: error,
              error: String(error),
            },
          }
        }
      },
    }),
    getRolePermissions: builder.query<PermissionRead[], number>({
      async queryFn(roleId: number) {
        try {
          const data =
            await RolesService.readRolePermissionsApiV1RolesRoleIdPermissionsGet(
              { roleId },
            )
          return { data }
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              data: error,
              error: String(error),
            },
          }
        }
      },
    }),
    addRole: builder.mutation<RoleRead, Partial<RoleRead>>({
      query: newRole => ({
        url: "roles",
        method: "POST",
        body: newRole,
      }),
      invalidatesTags: ["Roles"],
    }),
    updateRole: builder.mutation<RoleRead, { updatedRole: Partial<RoleRead> }>({
      query: ({ updatedRole }) => ({
        url: `roles/${String(updatedRole.id)}`,
        method: "PUT",
        body: updatedRole,
      }),
      invalidatesTags: ["Roles"],
    }),
    deleteRole: builder.mutation<{ success: boolean }, number>({
      query: id => ({
        url: `roles/${String(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useAddRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRolePermissionsQuery,
} = rolesApiSlice
