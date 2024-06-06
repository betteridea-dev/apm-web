

export const APM_ID = "UdPDhw5S7pByV3pVqwyr1qzJ8mR8ktzi9olgsdsyZz4"

export type Package = {
    Authors_: string[],
    Dependencies: string[],
    Description: string,
    ID: number,
    Installs: number,
    Items: string,
    Main: string,
    Name: string,
    Owner: string,
    PkgID: string,
    README: string,
    RepositoryUrl: string,
    Updated: number,
    Vendor: string,
    Version: string,
    Versions?: {PkgID:string, Version:string, Installs:number}[]
}

export type Tag = {
    name: string,
    value: string
}