

export const APM_ID = "RLvG3tclmALLBCrwc17NqzNFqZCrUf3-RKZ5v8VRHiU"

export type Package = {
    // Some fields returned by the backend can be JSON strings; support unions
    Authors_?: { name: string, email: string, url: string, address: string }[],
    Authors?: { name: string, email: string, url: string, address: string }[] | string,
    Dependencies: { [key: string]: { version: string } } | string,
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
    Keywords?: string[] | string,
    License?: string,
    Warnings?: { modifiesGlobalState?: boolean, installMessage?: string } | string,
    Timestamp: number,
    Vendor: string,
    Version: string,
    Versions?: { PkgID: string, Version: string, Installs: number }[]
}

export type Tag = {
    name: string,
    value: string
}