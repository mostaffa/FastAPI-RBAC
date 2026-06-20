import type { PermissionRead } from "@/api"
import { PermissionsService } from "@/api"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const permissionApiSlice = createApi({
  reducerPath: "permissionApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["Permissions"],
  endpoints: builder => ({
    getPermissions: builder.query<PermissionRead[], undefined>({
      async queryFn() {
        try {
          const data =
            await PermissionsService.readPermissionsApiV1PermissionsGet()
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
  }),
})

export const { useGetPermissionsQuery } = permissionApiSlice
