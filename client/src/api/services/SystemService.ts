/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { SystemInfo } from "../models/SystemInfo"
import type { CancelablePromise } from "../core/CancelablePromise"
import { OpenAPI } from "../core/OpenAPI"
import { request as __request } from "../core/request"
export class SystemService {
  /**
   * Read System Info
   * @returns SystemInfo Successful Response
   * @throws ApiError
   */
  public static readSystemInfoApiV1SystemGet(): CancelablePromise<SystemInfo> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/system/",
    })
  }
}
