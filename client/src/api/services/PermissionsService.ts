/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PermissionCreate } from '../models/PermissionCreate';
import type { PermissionRead } from '../models/PermissionRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PermissionsService {
    /**
     * Read Permissions
     * @returns PermissionRead Successful Response
     * @throws ApiError
     */
    public static readPermissionsApiV1PermissionsGet(): CancelablePromise<Array<PermissionRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/permissions/',
        });
    }
    /**
     * Create Permission
     * @returns PermissionRead Successful Response
     * @throws ApiError
     */
    public static createPermissionApiV1PermissionsPost({
        requestBody,
    }: {
        requestBody: PermissionCreate,
    }): CancelablePromise<PermissionRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/permissions/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Permission
     * @returns PermissionRead Successful Response
     * @throws ApiError
     */
    public static readPermissionApiV1PermissionsPermissionIdGet({
        permissionId,
    }: {
        permissionId: number,
    }): CancelablePromise<PermissionRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/permissions/{permission_id}',
            path: {
                'permission_id': permissionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Permission
     * @returns PermissionRead Successful Response
     * @throws ApiError
     */
    public static updatePermissionApiV1PermissionsPermissionIdPut({
        permissionId,
        requestBody,
    }: {
        permissionId: number,
        requestBody: PermissionCreate,
    }): CancelablePromise<PermissionRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/permissions/{permission_id}',
            path: {
                'permission_id': permissionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Permission
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deletePermissionApiV1PermissionsPermissionIdDelete({
        permissionId,
    }: {
        permissionId: number,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/permissions/{permission_id}',
            path: {
                'permission_id': permissionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
