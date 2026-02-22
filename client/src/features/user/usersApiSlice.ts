import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { UsersService } from "../../api"
import type { UserRead } from "../../api"

export const usersApiSlice = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["Users"],
  endpoints: builder => ({
    getUsers: builder.query<UserRead[], { skip?: number; limit?: number }>({
      async queryFn({ skip = 0, limit = 100 } = {}) {
        try {
          const data = await UsersService.readUsersApiV1UsersGet({
            skip,
            limit,
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
    }),
  }),
})

export const { useGetUsersQuery } = usersApiSlice
