import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { GitHubLogoIcon, MagnifyingGlassIcon, TwitterLogoIcon, DiscordLogoIcon, DownloadIcon } from "@radix-ui/react-icons"
import { connect } from "@permaweb/aoconnect"
import { APM_ID } from "@/utils/ao-vars"
import betterideaSVG from "@/assets/betteridea.svg"
import npmSVG from "@/assets/npm.svg"
import { Package } from "@/utils/ao-vars"
import { useLocalStorage } from "usehooks-ts"

function ExploreItem({ title, description, link, icon }: { title: string, description: string, link: string, icon?: React.ReactNode }) {
    return <Link href={link} target="_blank"
        className="bg-white border border-[#e7e7e7] hover:border-[#dcdcdc] hover:bg-[#fafafa] p-5 flex flex-col gap-2 rounded-std transition-colors">
        <div className="font-medium text-xl flex items-center gap-2">{icon} {title}</div>
        <div className="text-sm">{description}</div>
    </Link>
}

function formatNumber(value: number) {
    try { return new Intl.NumberFormat().format(value) } catch { return String(value) }
}

function timeAgoFromTimestamp(ts?: number) {
    if (ts === undefined || ts === null) return ""
    const n = Number(ts)
    if (!Number.isFinite(n)) return ""
    const then = (String(n).length <= 10 ? n * 1000 : n)
    if (!Number.isFinite(then)) return ""
    const diff = Date.now() - then
    if (!Number.isFinite(diff) || diff < 0) return ""
    const minutes = Math.floor(diff / (60 * 1000))
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    const years = Math.floor(months / 12)
    if (!Number.isFinite(years)) return ""
    return `${years}y ago`
}

function PackageItem({ data, setTitleVisible }: { data: Package, setTitleVisible: (b: boolean) => void }) {
    const title = `${data.Vendor == "@apm" ? "" : data.Vendor + "/"}${data.Name}`
    return (
        <Link href={`/pkg?id=${data.Vendor + "/" + data.Name}`} className="block cursor-pointer">
            <div className="w-full flex items-start justify-between gap-4 py-4 px-4 rounded-std border border-transparent hover:border-[#eaeaea] hover:bg-[#fafafa] transition-colors">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[18px] text-[#0f0f0f] truncate">{title}</span>
                        <span className="text-xs text-[#555] bg-[#f1f1f1] px-2 py-0.5 rounded-full">v{data.Version}</span>
                    </div>
                    <div className="text-[14px] text-[#555] mt-1">{data.Description}</div>
                    <div className="mt-2 text-[12px] text-[#777] flex items-center gap-2">
                        {(() => { const t = timeAgoFromTimestamp(data.Timestamp); return t ? <span>Updated {t}</span> : null })()}
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end text-[12px] text-[#666] shrink-0 w-[120px]">
                    <div className="text-[16px] text-sm flex items-center gap-1">{formatNumber(data.TotalInstalls)} <DownloadIcon strokeWidth="2px" /></div>
                    {/* <div className="uppercase tracking-wide">Installs</div> */}
                </div>
            </div>
        </Link>
    )
}

export default function Registry() {
    const [fetching, setFetching] = useState(false)
    const [searchDebouncer, setSearchDebouncer] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [packages, setPackages] = useLocalStorage<Package[]>("packages", [], { initializeWithValue: true })
    const [titleVisible, setTitleVisible] = useState(true)
    const [cuUrl] = useLocalStorage("apm-cu-url", "https://cu.ardrive.io", { initializeWithValue: true })
    const ao = connect({ CU_URL: cuUrl })

    async function getPopular() {
        setFetching(true)
        const res = await ao.dryrun({
            process: APM_ID,
            tags: [{ name: "Action", value: "APM.Popular" }],

        })
        setFetching(false)
        const { Messages } = res
        try {
            setPackages(JSON.parse(Messages[0].Data))
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { getPopular() }, [])


    useEffect(() => {
        sessionStorage.setItem("search-debouncer-timeout", JSON.stringify(setTimeout(() => {
            setSearchQuery(searchDebouncer)
        }, 500)))
        return () => clearTimeout(JSON.parse(sessionStorage.getItem("search-debouncer-timeout") as string))
    }, [searchDebouncer])

    useEffect(() => {
        if (!searchQuery) { getPopular(); return }
        console.log("Searching:", searchQuery)
        async function searchPackages() {
            setFetching(true)
            const res = await ao.dryrun({
                process: APM_ID,
                tags: [{ name: "Action", value: "APM.Search" }],
                data: searchQuery
            })
            setFetching(false)
            const { Messages } = res
            try {
                setPackages(JSON.parse(Messages[0].Data))
            } catch (e) {
                console.error(e)
            }
        }
        searchPackages()
    }, [searchQuery])

    useEffect(() => {
        console.log(packages)
    }, [packages])

    return <div className="grid grid-cols-1 md:grid-cols-5 gap-5 outline-none ring-none">
        {titleVisible && <title>Registry | APM | BetterIDEa</title>}
        <div className="col-span-3">
            <div><span className="text-xl font-bold p-5">Registry</span> Find published packages</div>
            <div className="bg-white border border-[#e7e7e7] p-3 rounded-lg flex gap-2 items-center my-5">
                <MagnifyingGlassIcon height={20} width={20} className="stroke-[#666] mx-2" />
                <input className="outline-none w-full bg-transparent text-[#333] placeholder:text-[#888]" placeholder="Search packages" onChange={(e) => setSearchDebouncer(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 overflow-scroll py-1 px-0.5">
                {
                    fetching && (
                        <div className="flex flex-col gap-1">
                            {Array.from({ length: 1 }).map((_, i) => (
                                <div key={i} className="w-full flex items-start justify-between gap-4 py-4 px-4 rounded-std bg-white">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-4 w-10 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-3/4 mt-2" />
                                        <div className="mt-2 flex items-center gap-2">
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end shrink-0 w-[120px]">
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                {packages.length > 0 ? packages.map((pkg, i) => {
                    if (!searchDebouncer) return <PackageItem setTitleVisible={setTitleVisible} data={pkg} key={i} />
                    else {
                        if (pkg.Name.toLowerCase().includes(searchDebouncer.toLowerCase()) || pkg.Vendor.toLowerCase().includes(searchDebouncer.toLowerCase())) return <PackageItem setTitleVisible={setTitleVisible} data={pkg} key={i} />

                    }
                }) : "No Packages Found"
                }
                {/* <PackageItem title="@betteridea/testpkg - 1.0.1" description="This is dummy description for a package registered on APM" installs={72} />
                <PackageItem title="testpkg" description="This is dummy description for a package registered on APM" installs={72} /> */}
            </div>
        </div>
        <div className="col-span-2">
            <div className="border border-[#e7e7e7] p-5 px-6 pb-10 rounded-[16px] flex flex-col gap-7 items-left justify-center my-5">
                <div>
                    <div className="font-medium text-xl">Explore</div>
                    <div className="text-sm">Checkout other products under the ecosystem</div>
                </div>
                <ExploreItem title="APM CLI Tool" description="CLI tool to easily publish and download apm packages" link="https://www.npmjs.com/package/apm-tool" icon={<Image src={npmSVG} width={16} height={16} alt="apm-cli" />} />
                <ExploreItem title="BetterIDEa" description="Online IDE for building AO processes" link="https://ide.betteridea.dev" icon={<Image src={betterideaSVG} width={16} height={16} alt="betteridea-logo" />} />
                <ExploreItem title="Portable Codecells" description="Node package to easily add LUA codecells to webapps" link="https://www.npmjs.com/package/@betteridea/codecell" icon={<Image src={npmSVG} width={16} height={16} alt="codecells" />} />
                {/* <ExploreItem title="LearnAO" description="Learn all about building on AO by actually building on AO" link="https://learn.betteridea.dev" icon={<Image src={learnSVG} width={16} height={16} alt="learn-logo" />} /> */}

                <div className="flex justify-evenly">
                    <Link href="https://twitter.com/betteridea_dev" target="_blank" className="bg-[#1DA1F2] p-3 rounded-[16px] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"><TwitterLogoIcon width={25} height={25} /></Link>
                    <Link href="https://discord.gg/nm6VKUQBrA" target="_blank" className="bg-[#7289DA] p-3 rounded-[16px] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"><DiscordLogoIcon width={25} height={25} /></Link>
                    <Link href="https://github.com/betteridea-dev" target="_blank" className="bg-[#333] p-3 rounded-[16px] text-white hover:scale-105 hover:shadow-lg transition-all duration-200"> <GitHubLogoIcon width={25} height={25} /></Link>
                </div>
            </div>
        </div>
    </div>
}