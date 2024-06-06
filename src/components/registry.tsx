import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import {toast} from "sonner"
import { GitHubLogoIcon, IdCardIcon, InfoCircledIcon, MagnifyingGlassIcon, PersonIcon } from "@radix-ui/react-icons"
import { connect } from "@permaweb/aoconnect"
import { APM_ID } from "@/utils/ao-vars"
import Markdown from "markdown-to-jsx"
import betterideaSVG from "@/assets/betteridea.svg"
import learnSVG from "@/assets/learn.svg"
import { Package } from "@/utils/ao-vars"

function ExploreItem({ title, description, link, icon }:{ title: string, description: string, link: string, icon?:React.ReactNode }) {
    return <Link href={link} target="_blank"
        className="bg-white p-5 flex flex-col gap-2 rounded-[16px] hover:scale-105 hover:shadow-lg transition-all duration-200">
        <div className="font-medium text-xl flex items-center gap-2">{ icon} {title}</div>
        <div className="text-sm">{description}</div>
    </Link>
}

function PackageItem({data,setTitleVisible}:{data:Package, setTitleVisible:(b:boolean)=>void}) {
    const title = `${data.Vendor == "@apm" ? "" : data.Vendor + "/"}${data.Name}`

    function openChange(open: boolean) {
        setTitleVisible(!open)
        if (!open) return console.log("closed", data.PkgID)
        console.log("opened", data.PkgID)
        // fetchPackage()

    }

    return <Drawer onOpenChange={openChange}>
        <DrawerTrigger className="bg-[#eee] p-6 px-7 rounded-[16px] ring-1 ring-[#e7e7e7] cursor-pointer">
            <div className="w-full flex justify-between"><span className="font-semibold text-[18px]">{title}</span> <span className="text-[#626262] text-sm">{data.Installs} installs</span></div>
            <div className="w-full flex justify-between items-end"><div className="text-[16px] text-left">{data.Description}</div> <span className="text-sm text-[#626262]">V{data.Version}</span></div>
        </DrawerTrigger>
        <DrawerContent className="md:px-7">
            <title>{data.Vendor}/{ data.Name} | APM | BetterIDEa</title>
            <DrawerHeader className="flex flex-col md:flex-row justify-between ">
                <div className="flex flex-col items-start">
                    <DrawerTitle className="text-xl">{title}</DrawerTitle>
                    <DrawerDescription>{data.Description}</DrawerDescription>
                </div>
                <div className="flex flex-col items-end">
                    {data.Owner && <div className="flex items-center gap-2"><span className="truncate text-sm">{data.Owner}</span><PersonIcon width={20} height={20} /></div>}
                    {data.PkgID && <div className="flex items-center gap-2"><span className="truncate text-sm">{data.PkgID}</span><IdCardIcon width={20} height={20} /></div>}
                </div>
            </DrawerHeader>
            <DrawerFooter>
                <div className="flex flex-col min-w-[28vw] gap-2">
                    <div>{data.Installs} installs for V{data.Version}</div>
                    <div className="bg-[#eee] rounded-[16px] p-3 px-5 flex flex-col">Installation command <code className="bg-white mt-3 p-3 rounded-[16px] pointer-events-auto">APM.install("{title}")</code></div>
                    <div className="flex gap-2 justify-center">
                        <Link href={`/pkg?id=${data.PkgID}`} target="_blank" className="bg-[#68A04E] flex justify-between pr-4 gap-4 text-white p-3 rounded-[16px]">More details <InfoCircledIcon width={25} height={25} /></Link>
                        <Link href={data.RepositoryUrl||"#"} target="_blank" className="bg-[#68A04E] flex justify-between pr-4 gap-4 text-white p-3 rounded-[16px]">View on GitHub <GitHubLogoIcon width={25} height={25} /></Link>
                    </div>
                </div>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>
}

export default function Registry() {
    const [fetching, setFetching] = useState(false)
    const [searchDebouncer, setSearchDebouncer] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [packages, setPackages] = useState<Package[]>([])
    const [titleVisible, setTitleVisible] = useState(true)
    const ao = connect()

    async function getAllPackages() {
        setFetching(true)
        const res = await ao.dryrun({
            process: APM_ID,
            tags: [{ name: "Action", value: "APM.GetAllPackages" }],

        })
        setFetching(false)
        const { Messages } = res
        try {
            setPackages(JSON.parse(Messages[0].Data))
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {getAllPackages()},[])


    useEffect(() => {
        sessionStorage.setItem("search-debouncer-timeout", JSON.stringify(setTimeout(() => {
            setSearchQuery(searchDebouncer)
        }, 500)))
        return () => clearTimeout(JSON.parse(sessionStorage.getItem("search-debouncer-timeout") as string))
    },[searchDebouncer])

    useEffect(() => {
        if (!searchQuery) {getAllPackages();return}
        console.log("Searching:", searchQuery)
        async function searchPackages() {
            setFetching(true)
            const res = await ao.dryrun({
                process: APM_ID,
                tags: [{ name: "Action", value: "APM.Search" }],
                data:  searchQuery 
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
    },[packages])

    return <div className="grid grid-cols-1 md:grid-cols-5 gap-5 outline-none ring-none">
        {titleVisible&&<title>Registry | APM | BetterIDEa</title>}
        <div className="col-span-3">
            <div><span className="text-xl font-bold p-5">Registry</span> Find published packages</div>
                <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center my-5">
                    <MagnifyingGlassIcon height={20} width={20} className="stroke-[#666] mx-2"/>
                    <input className="outline-none w-full bg-transparent text-[#666]" placeholder="Search" onChange={(e)=>setSearchDebouncer(e.target.value)} />
                </div>
            <div className="flex flex-col gap-3 overflow-scroll py-1 px-0.5 rounded-[16px]">
                {
                    fetching ? <>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[100%]" />
                                <Skeleton className="h-4 w-[90%]" />
                            </div>
                    </> : packages.length>0? packages.map((pkg, i) => {
                        return <PackageItem setTitleVisible={setTitleVisible} data={pkg} key={i} />
                    }) : "No Packages Found"
                }
                {/* <PackageItem title="@betteridea/testpkg - 1.0.1" description="This is dummy description for a package registered on APM" installs={72} />
                <PackageItem title="testpkg" description="This is dummy description for a package registered on APM" installs={72} /> */}
                </div>
        </div>
        <div className="col-span-2">
            <div className="bg-[#EEE] p-5 px-6 pb-10 rounded-[16px] flex flex-col gap-7 items-left justify-center my-5">
                <div>
                    <div className="font-medium text-xl">Explore</div>
                    <div className="text-sm">Checkout other products under the ecosystem</div>
                </div>
                <ExploreItem title="BetterIDEa" description="An online IDE for building AO processes" link="https://ide.betteridea.dev" icon={<Image src={betterideaSVG} width={16} height={16} alt="betteridea-logo" />} />
                <ExploreItem title="LearnAO" description="Learn all about building on AO by actually building on AO" link="https://learn.betteridea.dev" icon={<Image src={learnSVG} width={16} height={16} alt="learn-logo" />} />

            </div>
        </div>
    </div>
}