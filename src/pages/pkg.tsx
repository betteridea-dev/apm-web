import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { APM_ID, Tag } from "@/utils/ao-vars"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package } from "@/utils/ao-vars"
import Markdown from "markdown-to-jsx"
import Image from "next/image"
import betterideaSVG from "@/assets/betteridea.svg"
import Link from "next/link"
import { GitHubLogoIcon, IdCardIcon, PersonIcon, ReloadIcon, CopyIcon, CheckIcon } from "@radix-ui/react-icons"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
const SyntaxHighlighter = dynamic(() => import("@/components/LuaSyntaxHighlighter"), { ssr: false })

export default function PackageView() {
    const [pkg, setPackage] = useState<Package>()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [vendor, setVendor] = useState<string>("")
    const [pkgname, setPkgName] = useState<string>("")
    const [version, setVersion] = useState<string>("")
    const [activeTab, setActiveTab] = useState<string>("readme")
    const [address, setAddress] = useState<string>("")
    const [transferAddress, setTransferAddress] = useState<string>("")
    const [copiedInstall, setCopiedInstall] = useState<boolean>(false)
    const ao = connect({ CU_URL: "https://cu.arnode.asia" })
    const router = useRouter()
    const { id, name } = router.query


    useEffect(() => {
        if (!(id || name)) return
        console.log("Fetching package with ID or name:", id || name)
        // when route (id/name) changes (including selecting a version), go to Readme tab
        setActiveTab("readme")
        // reset state to avoid showing stale data during navigation
        setIsLoading(true)
        setPackage(undefined)

        async function fetchPackage() {
            let vendor, pkgname, version
            if (name) {
                // name can be in the following formats
                // @vendor/name
                // @vendor/name@version
                // name
                // name@version
                // extract vendor, name and version in seperate strings
                const parts = (name as string).split("/")
                if (parts.length == 2) {
                    vendor = parts[0]
                    setVendor(parts[0])
                    const nameParts = parts[1].split("@")
                    pkgname = nameParts[0]
                    setPkgName(nameParts[0])
                    version = nameParts[1]
                    setVersion(nameParts[1])
                } else {
                    const nameParts = (name as string).split("@")
                    pkgname = nameParts[0]
                    setPkgName(nameParts[0])
                    version = nameParts[1]
                    setVersion(nameParts[1])
                }
            }
            if (!vendor) vendor = "@apm"
            if (!vendor) setVendor("@apm")
            if (!version) version = ""
            if (!version) setVersion("")

            console.log(vendor, pkgname, version)



            const res = await ao.dryrun({
                process: APM_ID,
                tags: [{ name: "Action", value: "APM.Info" }],
                // data: JSON.stringify({ PkgID: id, Name: `${vendor}/${pkgname}`, Version: version }),
                data: id || name,
                signer: createDataItemSigner(window.arweaveWallet)
            })
            // return console.log(res)
            const { Messages, Output } = res
            if (Messages.length == 0) {
                toast.error(Output.data)
            } else {
                try {
                    const data = JSON.parse(Messages[0].Data)
                    console.log(data)
                    setPackage(data)
                }
                catch (e) {
                    console.error(e)
                }
            }
            setIsLoading(false)
        }
        fetchPackage()
    }, [id, name])

    function formatRelativeTime(timestamp?: number) {
        if (!timestamp) return "";
        const diffMs = Date.now() - timestamp
        const sec = Math.floor(diffMs / 1000)
        const min = Math.floor(sec / 60)
        const hr = Math.floor(min / 60)
        const day = Math.floor(hr / 24)
        if (day > 0) return `${day} day${day > 1 ? 's' : ''} ago`
        if (hr > 0) return `${hr} hour${hr > 1 ? 's' : ''} ago`
        if (min > 0) return `${min} minute${min > 1 ? 's' : ''} ago`
        return `just now`
    }

    async function connectWallet() {
        await window.arweaveWallet?.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"])
        const addr = await window.arweaveWallet?.getActiveAddress()
        setAddress(addr)
        toast.info(`Connected to ${addr}`)
    }

    async function transferOwnership() {
        const confirm = window.confirm(`Are you sure you want to transfer ownership of ${pkg?.Vendor}/${pkg?.Name} to ${address}?`)
        if (!confirm) return

        const m_id = await ao.message({
            process: APM_ID,
            tags: [
                { name: "Action", value: "APM.Transfer" },
                { name: "To", value: transferAddress }
            ],
            data: `${pkg?.Vendor}/${pkg?.Name}`,
            signer: createDataItemSigner(window.arweaveWallet)
        })

        const res = await ao.result({
            process: APM_ID,
            message: m_id
        })

        console.log(res)
        const { Messages } = res
        if (Messages.length == 0) {
            const { Output } = res
            if (Output.data) return toast.error(Output.data)
        }

        for (let i = 0; i < Messages.length; i++) {
            const tags = Messages[i].Tags
            tags.forEach((tag: Tag, _: number) => {
                console.log(tag.name, tag.value)
                if (tag.name == "Result" && tag.value == "success") {
                    toast.success("Ownership transferred successfully")
                } else if (tag.name == "Result" && tag.value == "error") {
                    toast.error("Error while transferring ownership")
                }
            })
        }
    }

    function safeParseJSON<T>(maybeJSON: any, fallback: T): T {
        try {
            if (typeof maybeJSON === 'string') return JSON.parse(maybeJSON) as T
            return (maybeJSON as T) ?? fallback
        } catch {
            return fallback
        }
    }

    const parsedDependencies = safeParseJSON<{ [k: string]: { version: string } }>(pkg?.Dependencies, {})
    const parsedAuthors = safeParseJSON<{ name: string, email: string, url: string, address: string }[]>(pkg?.Authors || pkg?.Authors_, [])
    const parsedKeywords = safeParseJSON<string[]>(pkg?.Keywords, [])
    const parsedWarnings = safeParseJSON<{ modifiesGlobalState?: boolean, installMessage?: string }>(pkg?.Warnings, {})

    return <><div className="p-5 min-h-screen">
        <title suppressHydrationWarning>{pkg?.Name ? `${pkg?.Vendor}/${pkg?.Name}` : "Loading..."} | APM | BetterIDEa</title>
        <div className="max-w-6xl mx-auto">
            <Link href="/" className="text-2xl p-5 flex gap-3 items-center"><Image width={35} height={35} alt="apm" src={"/icon.svg"} /> APM</Link>
            <div className="border-b my-3" />

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="w-full">
                    {isLoading || !pkg ? (
                        <div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-48" />
                            </div>
                            <Skeleton className="h-4 w-80 mt-2" />
                            <Skeleton className="h-3 w-64 mt-1" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                {pkg?.Vendor && (["@apm"].includes(pkg?.Vendor as string) ? "" : `${pkg?.Vendor}/`)}{pkg?.Name}
                                <Link href={pkg?.Repository || "#"}><GitHubLogoIcon width={24} height={24} className="mx-1" /></Link>
                            </div>
                            <div className="text-[#555]">{pkg?.Description}</div>
                            <div className="text-sm text-[#777]">{pkg?.Version && `v${pkg?.Version}`} • {pkg?.Installs} installs • published {formatRelativeTime(pkg?.Timestamp)}</div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                <div className="lg:col-span-8">
                    {/* top tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                        <div className="w-full">
                            <TabsList className="bg-[#f4f4f4] w-full rounded-[12px] p-0 grid grid-cols-4 md:w-fit md:inline-flex md:rounded-full">
                                <TabsTrigger value="readme" className="rounded-full px-4 py-2 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Readme</TabsTrigger>
                                <TabsTrigger value="source" className="rounded-full px-4 py-2 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Code</TabsTrigger>
                                <TabsTrigger value="dependencies" className="rounded-full px-4 py-2 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">{Object.keys(parsedDependencies || {}).length ? `${Object.keys(parsedDependencies || {}).length} Dependencies` : '0 Dependencies'}</TabsTrigger>
                                <TabsTrigger value="versions" className="rounded-full px-4 py-2 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">{pkg?.Versions ? `${pkg?.Versions?.length} Versions` : 'Versions'}</TabsTrigger>
                                <TabsTrigger value="config" className="rounded-full px-4 py-2 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white hidden md:inline-flex">Settings</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="my-4 w-full h-full bg-[#fff]">
                            <TabsContent value="readme">
                                <div className="rounded-[16px] bg-white">
                                    {isLoading || !pkg ? (
                                        <div className="space-y-2 p-4">
                                            <Skeleton className="h-4 w-[95%]" />
                                            <Skeleton className="h-4 w-[90%]" />
                                            <Skeleton className="h-4 w-[92%]" />
                                            <Skeleton className="h-4 w-[85%]" />
                                        </div>
                                    ) : (
                                        <Markdown
                                            options={{
                                                disableParsingRawHTML: true,
                                            }}
                                            className="markdown overflow-scroll">
                                            {Buffer.from(pkg?.Readme || "", 'hex').toString().trim()}
                                        </Markdown>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="source">
                                <div className="rounded-[16px] bg-white">
                                    {isLoading || !pkg ? (
                                        <div className="space-y-2 p-4">
                                            <Skeleton className="h-4 w-[95%]" />
                                            <Skeleton className="h-4 w-[90%]" />
                                            <Skeleton className="h-4 w-[92%]" />
                                            <Skeleton className="h-4 w-[85%]" />
                                        </div>
                                    ) : (
                                        <pre className="">
                                            {/* <code>
                                                {function () {
                                                    if (pkg?.Source) return (Buffer.from(pkg?.Source || "", 'hex').toString()).trim()
                                                    else return "... ? ..."
                                                }()}
                                            </code> */}
                                            <SyntaxHighlighter language="lua" showLineNumbers>
                                                {function () {
                                                    if (pkg?.Source) return (Buffer.from(pkg?.Source || "", 'hex').toString()).trim()
                                                    else return "-- source code not found\n-- please contact the author"
                                                }()}
                                            </SyntaxHighlighter>
                                        </pre>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="dependencies">
                                <div className="rounded-[16px] p-4">
                                    {isLoading || !pkg ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ) : (
                                        Object.keys(parsedDependencies).length === 0 ? (
                                            <div className="text-sm text-[#666]">No dependencies</div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {Object.entries(parsedDependencies).map(([name, meta]) => (
                                                    <Link
                                                        href={`/pkg?name=${encodeURIComponent(name)}@${encodeURIComponent(meta?.version || 'latest')}`}
                                                        key={name}
                                                        className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-[#e7e7e7] bg-white hover:bg-[#fafafa] hover:border-[#dcdcdc] transition-colors">
                                                        <span className="font-mono text-sm truncate group-hover:underline">{name}</span>
                                                        <span className="text-xs bg-[#f4f4f4] px-2 py-1 rounded-md font-mono">{meta?.version || 'latest'}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="config" className="flex flex-col gap-2">
                                <div className="bg-[#eee] rounded-[16px] p-4">
                                    <div>Published: {pkg?.Timestamp ? new Date(pkg?.Timestamp as number).toString() : ""}</div>
                                    <div>DBID: {pkg?.ID}</div>
                                    <div>PkgID: {pkg?.PkgID}</div>
                                    <div>Version: {pkg?.Version}</div>
                                    <div>Total Installs (all versions): {pkg?.TotalInstalls}</div>
                                    <div>Owner: {pkg?.Owner}</div>
                                    <div>Repository: <Link href={pkg?.Repository || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer" className="text-[#68A04E]">{pkg?.Repository}</Link></div>

                                    <div className="flex gap-2 my-2">
                                        <Input type="text" placeholder="Transfer to process or address" onChange={(e) => setTransferAddress(e.target.value)} />
                                        {address ? <Button onClick={transferOwnership}>Transfer Ownership</Button> : <Button onClick={connectWallet}>Connect Wallet</Button>}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="versions" className="flex flex-col-reverse gap-2">
                                {isLoading || !pkg ? (
                                    <div className="space-y-2 p-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : pkg?.Versions?.map((v, i) => {
                                    const isSelected = (version || pkg?.Version) === v.Version
                                    let endpoint = "/pkg?name="
                                    if (pkg?.Vendor) endpoint += `${pkg?.Vendor}/`
                                    if (pkg?.Name) endpoint += pkg?.Name
                                    endpoint += `@${v.Version}`

                                    return (
                                        <Link
                                            href={endpoint}
                                            key={i}
                                            onClick={() => setActiveTab('readme')}
                                            className={`group flex items-center justify-between gap-3 p-3 rounded-lg border bg-white transition-colors ${isSelected ? 'border-[#68A04E] bg-[#68A04E]/10' : 'border-[#e7e7e7] hover:bg-[#fafafa] hover:border-[#dcdcdc]'}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-mono text-sm truncate group-hover:underline">{v.Version}</span>
                                                {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#68A04E] text-white">selected</span>}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs bg-[#f4f4f4] px-2 py-1 rounded-md font-mono">{v.Installs} installs</span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-4 flex flex-col gap-4">
                    {isLoading || !pkg ? (
                        <>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px]">
                                <div className="text-sm text-[#666]">Install</div>
                                <div className="mt-3"><Skeleton className="h-10 w-full rounded-[12px]" /></div>
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                <div className="text-sm text-[#666]">Repository</div>
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-52" />
                                <Skeleton className="h-4 w-60" />
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                <div className="text-sm text-[#666]">Authors</div>
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                <div className="text-sm text-[#666]">Keywords</div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-6 w-14 rounded-full" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px]">
                                <div className="text-sm text-[#666]">Install</div>
                                <div className="mt-3 flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-[#e7e7e7] p-3 rounded-[12px] text-sm overflow-x-auto">apm.install "{pkg?.Vendor == "@apm" ? "" : pkg?.Vendor + "/"}{pkg?.Name}{(version && version !== "latest") ? "@" + version : ''}"</code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Copy install command"
                                        className=" rounded-[10px] w-5 h-5"
                                        onClick={() => {
                                            const cmd = `apm.install "${pkg?.Vendor == "@apm" ? "" : pkg?.Vendor + "/"}${pkg?.Name}${(version && version !== "latest") ? "@" + version : ''}"`
                                            navigator.clipboard.writeText(cmd)
                                            setCopiedInstall(true)
                                            window.setTimeout(() => setCopiedInstall(false), 1000)
                                        }}
                                    >
                                        {copiedInstall ? <CheckIcon /> : <CopyIcon />}
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-1">
                                <div className="text-sm text-[#666]">Repository</div>
                                <Link href={pkg?.Repository || '#'} target="_blank" className="text-[#68A04E] break-all">{pkg?.Repository || 'N/A'}</Link>
                            </div>
                            <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-1">
                                <div className="flex justify-between text-sm"><span>Version</span><span className="font-mono">{pkg?.Version}</span></div>
                                <div className="flex justify-between text-sm"><span>Installs (current version)</span><span className="font-mono">{pkg?.Installs}</span></div>
                                <div className="flex justify-between text-sm"><span>Total Installs</span><span className="font-mono">{pkg?.TotalInstalls}</span></div>
                                <div className="flex justify-between text-sm"><span>Published</span><span className="font-mono">{formatRelativeTime(pkg?.Timestamp)}</span></div>
                                <div className="flex items-center gap-2 text-sm truncate"><PersonIcon width={16} height={16} /> <span className="truncate">{pkg?.Owner}</span></div>
                                <div className="flex items-center gap-2 text-sm truncate"><IdCardIcon width={16} height={16} /> <span className="truncate">{pkg?.PkgID}</span></div>
                            </div>

                            {parsedAuthors.length > 0 && (
                                <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                    <div className="text-sm text-[#666]">Authors</div>
                                    <div className="flex flex-col gap-2">
                                        {parsedAuthors.map((a, i) => (
                                            <div key={i} className="text-sm">
                                                <div className="font-medium">{a.name}</div>
                                                <div className="text-[#666] break-all">{a.email}</div>
                                                <Link href={a.url || '#'} target="_blank" className="text-[#68A04E] break-all">{a.url}</Link>
                                                <div className="text-xs text-[#666] break-all">{a.address}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {parsedKeywords.length > 0 && (
                                <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                    <div className="text-sm text-[#666]">Keywords</div>
                                    <div className="flex flex-wrap gap-2">
                                        {parsedKeywords.map((k, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white border">{k}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(pkg?.License || parsedWarnings.installMessage || parsedWarnings.modifiesGlobalState) && (
                                <div className="bg-[#f6f6f6] p-4 rounded-[16px] flex flex-col gap-2">
                                    {pkg?.License && <div className="text-sm"><span className="text-[#666]">License:</span> <span className="font-mono">{pkg?.License}</span></div>}
                                    {parsedWarnings.installMessage && <div className="text-sm text-[#a15c00]">⚠️ {parsedWarnings.installMessage}</div>}
                                    {parsedWarnings.modifiesGlobalState && <div className="text-sm text-[#a15c00]">⚠️ Modifies global state</div>}
                                </div>
                            )}
                        </>
                    )}
                </aside>
            </div>
        </div>
    </div>
        <Footer />
    </>
}