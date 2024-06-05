import { useRouter } from "next/router"
import { useState,useEffect } from "react"
import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { APM_ID } from "@/utils/ao-vars"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package } from "@/utils/ao-vars"
import Markdown from "markdown-to-jsx"
import Image from "next/image"
import betterideaSVG from "@/assets/betteridea.svg"
import Link from "next/link"
import { IdCardIcon, PersonIcon } from "@radix-ui/react-icons"

export default function PackageView() {
    const [pkg, setPackage] = useState<Package>()
    const [vendor, setVendor] = useState<string>("")
    const [pkgname, setPkgName] = useState<string>("")
    const [version, setVersion] = useState<string>("")
    const ao = connect()
    const router = useRouter()
    const {id,name} = router.query


    useEffect(() => {
        if (!(id || name)) return
        console.log("Fetching package with ID or name:", id||name)

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
            if(!version) version = "latest"
            if(!version) setVersion("latest")

            console.log(vendor, pkgname, version)
            


            const res = await ao.dryrun({
                process: APM_ID,
                tags: [{ name: "Action", value: "Info" }],
                data: JSON.stringify({ PkgID: id, Name: `${vendor}/${pkgname}`, Version: version }),
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
        }
        fetchPackage()
    },[id,name])

    return <div className="p-5">
        <title suppressHydrationWarning>{pkg?.Name ?`${pkg?.Vendor}/${pkg?.Name}`:"Loading..."} | APM | BetterIDEa</title>
        <Link href="/" className="text-2xl p-5 flex gap-3 items-center"><Image width={35} height={35} alt="apm" src={"/icon.svg"} /> APM (beta)</Link>
        <hr className="my-3"/>
        <div className="text-3xl md:ml-5 font-bold">
            { pkg?.Vendor&&( ["@apm"].includes(pkg?.Vendor as string)?"":`${pkg?.Vendor}/`)}{pkg?.Name ? pkg?.Name : "Loading..."}
        </div>
        <div className="md:ml-5">{pkg?.Description}</div>
        <div className="md:ml-5">{pkg?.Version && `V${pkg?.Version}`} - { pkg?.Installs} installs</div>
        <div className="md:ml-5 text-sm truncate md:text-base flex gap-2 items-center"><PersonIcon width={20} height={20} /> {pkg?.Owner && pkg?.Owner}</div>
        <div className="md:ml-5 text-sm truncate md:text-base flex gap-2 items-center"><IdCardIcon width={20} height={ 20} /> {pkg?.PkgID && pkg?.PkgID}</div>
        <hr className="my-3" />
        {/* tabview */}
        <Tabs defaultValue="readme" className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center justify-center relative w-full">
                <TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit">
                    <TabsTrigger value="readme" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Readme</TabsTrigger>
                    <TabsTrigger value="source" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Source Code</TabsTrigger>
                    {/* <TabsTrigger value="info" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Info</TabsTrigger> */}
                    <TabsTrigger value="install" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Install</TabsTrigger>
                    <TabsTrigger value="versions" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Version History</TabsTrigger>
                </TabsList>
            </div>
            <div className="my-5 w-full h-full px-5 bg-[#eee] rounded-[16px] pb-2">
                <TabsContent value="readme">
                    <Markdown className="markdown overflow-scroll">{Buffer.from(pkg?.README||"", 'hex').toString()}</Markdown>
                </TabsContent>
                <TabsContent value="source">
                    <pre className=" overflow-scroll">
                    <code>
                            {function () { 
                                if (pkg?.Items) return (JSON.parse(Buffer.from(pkg?.Items || "", 'hex').toString())[0].data)
                                else return "..."
                        }()}
                        </code>
                    </pre>
                    </TabsContent>
                <TabsContent value="info">
                    <div>DBID: {pkg?.ID}</div>
                    <div>PkgID: { pkg?.PkgID}</div>
                    <div>Version: {pkg?.Version}</div>
                    <div>Authors: {pkg?.Authors_}</div>
                </TabsContent>
                <TabsContent value="install">
                    <div className="flex flex-col p-5">Installation command <code className="bg-white mt-3 p-3 rounded-[16px] pointer-events-auto">APM.install("{pkg?.Vendor == "@apm" ? "" : pkg?.Vendor + "/"}{pkg?.Name}{version && (version=="latest"?"":"@"+version )}")</code></div>
                </TabsContent>
                <TabsContent value="versions" className="flex flex-col-reverse gap-2">
                    {
                        pkg?.Versions?.map((v, i) => {
                            let endpoint = "/pkg?name="
                            if (pkg?.Vendor) endpoint += `${pkg?.Vendor}/`
                            if (pkg?.Name) endpoint += pkg?.Name
                            endpoint += `@${v.Version}`

                            return <Link href={endpoint} key={i} className="p-4 font-mono bg-white rounded-[16px] text-sm md:text-base truncate">
                                <div>{v.Version} | {v.Installs} installs | <span className="text-xs">{v.PkgID}</span></div>
                            </Link>
                        })
                        }
                </TabsContent>
            </div>
        </Tabs>
    </div>
    
}