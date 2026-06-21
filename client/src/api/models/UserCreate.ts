/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Docstring for UserCreate
 * Schema for creating a new user.
 */
export type UserCreate = {
    username: string;
    email: string;
    first_name?: (string | null);
    last_name?: (string | null);
    password: string;
    active?: boolean;
    role_id?: (number | null);
};

