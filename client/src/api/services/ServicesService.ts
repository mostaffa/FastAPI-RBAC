/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { ServicesSnapshot } from "../models/ServicesSnapshot"
import type { ServiceStateUpdateRequest } from "../models/ServiceStateUpdateRequest"
import type { ServiceStateUpdateResponse } from "../models/ServiceStateUpdateResponse"
import type { CancelablePromise } from "../core/CancelablePromise"
import { OpenAPI } from "../core/OpenAPI"
import { request as __request } from "../core/request"
export class ServicesService {
  /**
   * Read Services
   * @returns ServicesSnapshot Successful Response
   * @throws ApiError
   */
  public static readServicesApiV1ServicesGet({
    includeDetails = false,
  }: {
    includeDetails?: boolean
  }): CancelablePromise<ServicesSnapshot> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/services/",
      query: {
        include_details: includeDetails,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
  /**
   * Update Service State
   * @returns ServiceStateUpdateResponse Successful Response
   * @throws ApiError
   */
  public static updateServiceStateApiV1ServicesStatePost({
    requestBody,
  }: {
    requestBody: ServiceStateUpdateRequest
  }): CancelablePromise<ServiceStateUpdateResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/services/state",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }
}
