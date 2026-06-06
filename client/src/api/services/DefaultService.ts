/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { CancelablePromise } from "../core/CancelablePromise"
import { OpenAPI } from "../core/OpenAPI"
import { request as __request } from "../core/request"
export class DefaultService {
  /**
   * Serve React
   * Serve the React app for all unmatched routes (SPA catch-all)
   * React Router will handle the routing on the client side
   * @returns any Successful Response
   * @throws ApiError
   */
  public static serveReactPathParamGet({
    pathParam,
  }: {
    pathParam: string
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/{path_param}",
      path: {
        path_param: pathParam,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
}
