import { useRouter } from "next/router"
import { useState,useEffect } from "react"
import { connect } from "@permaweb/aoconnect"
import { APM_ID } from "@/utils/ao-vars"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package } from "@/utils/ao-vars"
import Markdown from "markdown-to-jsx"
import Image from "next/image"
import betterideaSVG from "@/assets/betteridea.svg"
import Link from "next/link"

export default function PackageView() {
    const [pkg, setPackage] = useState<Package>()
    const ao = connect()
    const router = useRouter()
    const {id} = router.query
    

    useEffect(() => {
        if (!id) return
        console.log("Fetching package with ID:", id)

        async function fetchPackage() {
            const res = await ao.dryrun({
                process: APM_ID,
                tags: [{ name: "Action", value: "Info" }],
                data: JSON.stringify({ PkgID: id })
            })
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
    },[id])

    return <div className="p-5">
        <Link href="/" className="text-3xl p-5 flex gap-3 items-center"><Image width={30} height={30} alt="apm" src={betterideaSVG} /> APM (beta)</Link>
        <hr className="my-3"/>
        <div className="text-3xl pl-5 font-bold">
            { pkg?.Vendor&&( ["@apm"].includes(pkg?.Vendor as string)?"":`${pkg?.Vendor}/`)}{pkg?.Name ? pkg?.Name : "Loading..."}
        </div>
        <div className="pl-5">{pkg?.Description}</div>
        <div className="pl-5">{pkg?.Version && `V${pkg?.Version}`}</div>
        <div className="pl-5">{pkg?.Owner && pkg?.Owner}</div>
        <div className="pl-5">{pkg?.PkgID && pkg?.PkgID}</div>
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
                    <div className="flex flex-col p-5">Installation command <code className="bg-white mt-3 p-3 rounded-[16px] pointer-events-auto">APM.install("{pkg?.Vendor=="@apm"?"":pkg?.Vendor+"/"}{pkg?.Name}")</code></div>
                </TabsContent>
                <TabsContent value="versions">
                    TODO
                </TabsContent>
            </div>
        </Tabs>
    </div>
    
}