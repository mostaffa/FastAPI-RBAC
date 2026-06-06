/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
import type { ServiceItem } from "./ServiceItem"
import type { ServicesSourceError } from "./ServicesSourceError"
export type ServicesSnapshot = {
  timestamp: string
  linux_available: boolean
  docker_available: boolean
  items: Array<ServiceItem>
  errors: Array<ServicesSourceError>
}
