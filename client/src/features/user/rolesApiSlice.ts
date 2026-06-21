import type { PermissionRead, RoleRead } from "@/api"
import { RolesService } from "@/api/services/RolesService"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"

export const rolesApiSlice = createApi({
  reducerPath: "rolesApi",
  baseQuery: fakeBaseQuery(),
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
      async queryFn(newRole) {
        try {
          const data = await RolesService.createRoleApiV1RolesPost({
            requestBody: newRole as RoleRead,
          })
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
      invalidatesTags: ["getRoles"],
    }),
    updateRole: builder.mutation<
      RoleRead,
      { roleId: number; roleName: string }
    >({
      async queryFn({ roleId, roleName }) {
        try {
          const data = await RolesService.updateRoleApiV1RolesRoleIdPut({
            roleId,
            requestBody: { name: roleName },
          })
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

      invalidatesTags: ["getRoles"],
    }),
    deleteRole: builder.mutation<{ success: boolean }, number>({
      async queryFn(id) {
        try {
          await RolesService.deleteRoleApiV1RolesRoleIdDelete({ roleId: id })
          return { data: { success: true } }
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
