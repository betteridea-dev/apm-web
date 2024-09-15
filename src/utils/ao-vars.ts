

export const APM_ID = "DKF8oXtPvh3q8s0fJFIeHFyHNM6oKrwMCUrPxEMroak"

export type Package = {
    Authors_: { name: string, email: string, url: string, address: string }[],
    Dependencies: { [key: string]: { version: string } },
    Description: string,
    ID: number,
    Installs: number,
    TotalInstalls: number,
    Source: string,
    // Main: string,
    Name: string,
    Owner: string,
    PkgID: string,
    Readme: string,
    Repository: string,
    Timestamp: number,
    Vendor: string,
    Version: string,
    Versions?: { PkgID: string, Version: string, Installs: number }[]
}

export type Tag = {
    name: string,
    value: string
}