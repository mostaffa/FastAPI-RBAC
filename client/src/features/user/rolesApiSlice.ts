import type { PermissionRead, RoleRead } from "@/api"
import { RolesService } from "@/api/services/RolesService"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const rolesApiSlice = createApi({
  reducerPath: "rolesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["getRoles", "Permissions"],
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
      providesTags: ["getRoles"],
      // invalidatesTags: ["Roles"],
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
      invalidatesTags: ["getRoles"],
    }),
    updateRole: builder.mutation<RoleRead, { updatedRole: Partial<RoleRead> }>({
      query: ({ updatedRole }) => ({
        url: `roles/${String(updatedRole.id)}`,
        method: "PUT",
        body: updatedRole,
      }),
      invalidatesTags: ["getRoles"],
    }),
    deleteRole: builder.mutation<{ success: boolean }, number>({
      query: id => ({
        url: `roles/${String(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["getRoles"],
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
