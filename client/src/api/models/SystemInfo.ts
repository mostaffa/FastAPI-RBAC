/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* eslint-disable */
export type SystemInfo = {
    hostname: string;
    fqdn: string;
    os_name: string;
    os_release: string;
    os_version: string;
    platform: string;
    architecture: string;
    machine: string;
    processor: string;
    python_version: string;
    timezone: string;
    boot_time_utc?: (string | null);
    uptime_seconds?: (number | null);
    is_vm: boolean;
    is_docker: boolean;
    is_kubernetes: boolean;
    virtualization_hint?: (string | null);
    cpu_count_logical?: (number | null);
    cpu_count_physical?: (number | null);
    memory_total_bytes?: (number | null);
    memory_available_bytes?: (number | null);
    disk_total_bytes?: (number | null);
    disk_used_bytes?: (number | null);
    disk_free_bytes?: (number | null);
    mac_address?: (string | null);
    ip_addresses: Array<string>;
};

