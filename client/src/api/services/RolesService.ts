/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { PermissionRead } from '../models/PermissionRead';
import type { RoleCreate } from '../models/RoleCreate';
import type { RoleRead } from '../models/RoleRead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RolesService {
    /**
     * Read Roles
     * @returns RoleRead Successful Response
     * @throws ApiError
     */
    public static readRolesApiV1RolesGet(): CancelablePromise<Array<RoleRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/',
        });
    }
    /**
     * Create Role
     * @returns RoleRead Successful Response
     * @throws ApiError
     */
    public static createRoleApiV1RolesPost({
        requestBody,
    }: {
        requestBody: RoleCreate,
    }): CancelablePromise<RoleRead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/roles/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Role
     * @returns RoleRead Successful Response
     * @throws ApiError
     */
    public static readRoleApiV1RolesRoleIdGet({
        roleId,
    }: {
        roleId: number,
    }): CancelablePromise<RoleRead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/{role_id}',
            path: {
                'role_id': roleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Role
     * @returns RoleRead Successful Response
     * @throws ApiError
     */
    public static updateRoleApiV1RolesRoleIdPut({
        roleId,
        requestBody,
    }: {
        roleId: number,
        requestBody: RoleCreate,
    }): CancelablePromise<RoleRead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/roles/{role_id}',
            path: {
                'role_id': roleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Role
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteRoleApiV1RolesRoleIdDelete({
        roleId,
    }: {
        roleId: number,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/roles/{role_id}',
            path: {
                'role_id': roleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read Role Permissions
     * @returns PermissionRead Successful Response
     * @throws ApiError
     */
    public static readRolePermissionsApiV1RolesRoleIdPermissionsGet({
        roleId,
    }: {
        roleId: number,
    }): CancelablePromise<Array<PermissionRead>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/{role_id}/permissions',
            path: {
                'role_id': roleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Assign Permission To Role
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assignPermissionToRoleApiV1RolesRoleIdPermissionsPermissionIdPost({
        roleId,
        permissionId,
    }: {
        roleId: number,
        permissionId: number,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/roles/{role_id}/permissions/{permission_id}',
            path: {
                'role_id': roleId,
                'permission_id': permissionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Permission From Role
     * @returns any Successful Response
     * @throws ApiError
     */
    public static removePermissionFromRoleApiV1RolesRoleIdPermissionsPermissionIdDelete({
        roleId,
        permissionId,
    }: {
        roleId: number,
        permissionId: number,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/roles/{role_id}/permissions/{permission_id}',
            path: {
                'role_id': roleId,
                'permission_id': permissionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
