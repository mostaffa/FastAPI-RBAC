/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { UserCreate } from "../models/UserCreate"
import type { UserRead } from "../models/UserRead"
import type { CancelablePromise } from "../core/CancelablePromise"
import { OpenAPI } from "../core/OpenAPI"
import { request as __request } from "../core/request"
export class UsersService {
  /**
   * Create User
   * @returns UserRead Successful Response
   * @throws ApiError
   */
  public static createUserApiV1UsersPost({
    requestBody,
  }: {
    requestBody: UserCreate
  }): CancelablePromise<UserRead> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/users/",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }
  /**
   * Read Users
   * @returns UserRead Successful Response
   * @throws ApiError
   */
  public static readUsersApiV1UsersGet({
    skip,
    limit = 10,
  }: {
    skip?: number
    limit?: number
  }): CancelablePromise<Array<UserRead>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/",
      query: {
        skip: skip,
        limit: limit,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
  /**
   * Read User
   * @returns UserRead Successful Response
   * @throws ApiError
   */
  public static readUserApiV1UsersUserIdGet({
    userId,
  }: {
    userId: number
  }): CancelablePromise<UserRead> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
  /**
   * Delete User
   * @returns any Successful Response
   * @throws ApiError
   */
  public static deleteUserApiV1UsersUserIdDelete({
    userId,
  }: {
    userId: number
  }): CancelablePromise<Record<string, any>> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      errors: {
        422: `Validation Error`,
      },
    })
  }
  /**
   * Update User
   * @returns UserRead Successful Response
   * @throws ApiError
   */
  public static updateUserApiV1UsersUserIdPut({
    userId,
    requestBody,
  }: {
    userId: number
    requestBody: UserRead
  }): CancelablePromise<UserRead> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/users/{user_id}",
      path: {
        user_id: userId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    })
  }
}
