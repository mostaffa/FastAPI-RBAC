import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  ServicesService,
  type ServiceStateUpdateRequest,
  type ServiceStateUpdateResponse,
  type ServicesSnapshot,
} from "@/api"

type ServicesSnapshotArgs = {
  includeDetails?: boolean
}

export const servicesApiSlice = createApi({
  reducerPath: "servicesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1" }),
  tagTypes: ["Services"],
  endpoints: builder => ({
    getServicesSnapshot: builder.query<ServicesSnapshot, ServicesSnapshotArgs>({
      async queryFn({ includeDetails = false }) {
        try {
          const data = await ServicesService.readServicesApiV1ServicesGet({
            includeDetails,
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
      providesTags: ["Services"],
    }),
    updateServiceState: builder.mutation<
      ServiceStateUpdateResponse,
      ServiceStateUpdateRequest
    >({
      async queryFn(body) {
        try {
          const data = await ServicesService.updateServiceStateApiV1ServicesStatePost({
            requestBody: body,
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
      invalidatesTags: ["Services"],
    }),
  }),
})

export const { useGetServicesSnapshotQuery, useUpdateServiceStateMutation } =
  servicesApiSlice
