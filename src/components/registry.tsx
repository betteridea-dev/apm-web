import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"

import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

import { connect } from "@permaweb/aoconnect"

import betterideaSVG from "@/assets/betteridea.svg"
import learnSVG from "@/assets/learn.svg"

import { APM_ID } from "@/utils/ao-vars"

function ExploreItem({ title, description, link, icon }:{ title: string, description: string, link: string, icon?:React.ReactNode }) {
    return <Link href={link} target="_blank"
        className="bg-white p-5 flex flex-col gap-2 rounded-[16px] hover:scale-105 hover:shadow-lg transition-all duration-200">
        <div className="font-medium text-xl flex items-center gap-2">{ icon} {title}</div>
        <div className="text-sm">{description}</div>
    </Link>
}

function PackageItem({data}:{data:Package}) {
    const title = `${data.Vendor == "@apm" ? "" : data.Vendor + "/"}${data.Name}@${data.Version}`
    return <div className="bg-[#eee] p-6 px-7 rounded-[16px] ring-1 ring-[#e7e7e7] cursor-pointer">
        <div className="w-full flex justify-between"><span className="font-semibold text-[18px]">{title}</span> <span className="text-[#626262] text-sm">{data.Installs} installs</span></div>
        <div className="text-[16px]">{data.Description}</div>
    </div>
}

type Package = {
    Vendor: string,
    Name: string,
    Version: string,
    Description: string,
    Owner: string,
    RepositoryUrl: string,
    PkgID: string,
    Installs: number
}

export default function Registry() {
    const [fetching, setFetching] = useState(false)
    const [searchDebouncer, setSearchDebouncer] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [packages, setPackages] = useState<Package[]>([])
    const ao = connect()

    async function getAllPackages() {
        setFetching(true)
        const res = await ao.dryrun({
            process: APM_ID,
            tags: [{ name: "Action", value: "GetAllPackages" }],

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
                tags: [{ name: "Action", value: "Search" }],
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
        <div className="col-span-3">
            <div><span className="text-xl font-bold p-5">Registry</span> Find published packages</div>
                <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center my-5">
                    <MagnifyingGlassIcon height={20} width={20} className="stroke-[#666] mx-2"/>
                    <input className="outline-none w-full bg-transparent text-[#666]" placeholder="Search" onChange={(e)=>setSearchDebouncer(e.target.value)} />
                </div>
            <div className="flex flex-col gap-3 overflow-scroll max-h-[64vh] py-1 px-0.5 rounded-[16px]">
                {
                    fetching ? <>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[100%]" />
                                <Skeleton className="h-4 w-[90%]" />
                            </div>
                    </> : packages.length>0? packages.map((pkg, i) => {
                        return <PackageItem data={pkg} key={i} />
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