import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { SystemInfo } from "@/api"
import { SystemService } from "@/api"

export const systemApiSlice = createApi({
  reducerPath: "systemApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["SystemInfo"],
  endpoints: builder => ({
    getSystemInfo: builder.query<SystemInfo, undefined>({
      async queryFn() {
        try {
          const data = await SystemService.readSystemInfoApiV1SystemGet()
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
      providesTags: ["SystemInfo"],
    }),
  }),
})

export const { useGetSystemInfoQuery } = systemApiSlice
