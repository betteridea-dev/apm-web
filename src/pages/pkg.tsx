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
import { GitHubLogoIcon, IdCardIcon, PersonIcon } from "@radix-ui/react-icons"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PackageView() {
    const [pkg, setPackage] = useState<Package>()
    const [vendor, setVendor] = useState<string>("")
    const [pkgname, setPkgName] = useState<string>("")
    const [version, setVersion] = useState<string>("")
    const [address, setAddress] = useState<string>("")
    const [transferAddress, setTransferAddress] = useState<string>("")
    const ao = connect()
    const router = useRouter()
    const { id, name } = router.query


    useEffect(() => {
        if (!(id || name)) return
        console.log("Fetching package with ID or name:", id || name)

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
        }
        fetchPackage()
    }, [id, name])

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

    return <><div className="p-5 min-h-screen">
        <title suppressHydrationWarning>{pkg?.Name ? `${pkg?.Vendor}/${pkg?.Name}` : "Loading..."} | APM | BetterIDEa</title>
        <Link href="/" className="text-2xl p-5 flex gap-3 items-center"><Image width={35} height={35} alt="apm" src={"/icon.svg"} /> APM (beta)</Link>
        <hr className="my-3" />
        <div className="text-3xl md:ml-5 font-bold flex items-center">
            {pkg?.Vendor && (["@apm"].includes(pkg?.Vendor as string) ? "" : `${pkg?.Vendor}/`)}{pkg?.Name ? pkg?.Name : "Loading..."}
            <Link href={pkg?.Repository || "#"}><GitHubLogoIcon width={28} height={28} className="mx-2" /></Link>
        </div>
        <div className="md:ml-5">{pkg?.Description}</div>
        <div className="md:ml-5">{pkg?.Version && `V${pkg?.Version}`} - {pkg?.Installs} installs</div>
        <div className="md:ml-5 text-sm truncate md:text-base flex gap-2 items-center"><PersonIcon width={20} height={20} /> {pkg?.Owner && pkg?.Owner}</div>
        <div className="md:ml-5 text-sm truncate md:text-base flex gap-2 items-center"><IdCardIcon width={20} height={20} /> {pkg?.PkgID && pkg?.PkgID}</div>
        <hr className="my-3" />
        {/* tabview */}
        <Tabs defaultValue="readme" className="w-full flex flex-col items-center">
            <div className="flex flex-row items-center justify-center relative w-full">
                <TabsList className="bg-[#EEEEEE] w-full md:w-fit rounded-[16px] flex flex-col md:flex-row h-fit">
                    <TabsTrigger value="readme" className="rounded-[16px] w-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Readme</TabsTrigger>
                    <TabsTrigger value="source" className="rounded-[16px] w-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Source Code</TabsTrigger>
                    {/* <TabsTrigger value="info" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Info</TabsTrigger> */}
                    <TabsTrigger value="install" className="rounded-[16px] w-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Install</TabsTrigger>
                    <TabsTrigger value="versions" className="rounded-[16px] w-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Version History</TabsTrigger>
                    <TabsTrigger value="config" className="rounded-[16px] w-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Config</TabsTrigger>
                </TabsList>
            </div>
            <div className="my-5 w-full h-full px-5 bg-[#eee] rounded-[16px] pb-2">
                <TabsContent value="readme">
                    <Markdown className="markdown overflow-scroll">{Buffer.from(pkg?.Readme || "", 'hex').toString()}</Markdown>
                </TabsContent>
                <TabsContent value="source">
                    <pre className=" overflow-scroll">
                        <code>
                            {function () {
                                if (pkg?.Source) return (Buffer.from(pkg?.Source || "", 'hex').toString())
                                else return "..."
                            }()}
                        </code>
                    </pre>
                </TabsContent>
                <TabsContent value="config" className="flex flex-col gap-1">
                    <div>Last Updated: {new Date(pkg?.Timestamp as number).toString()}</div>
                    <div>DBID: {pkg?.ID}</div>
                    <div>PkgID: {pkg?.PkgID}</div>
                    <div>Version: {pkg?.Version}</div>
                    <div>Total Installs (all versions): {
                        pkg?.Versions?.reduce((acc, v) => acc + v.Installs, 0)
                    }</div>
                    <div>Owner: {pkg?.Owner}</div>
                    <div>Repository: <Link href={pkg?.Repository || "#"}
                        target="_blank"
                        rel="noopener noreferrer" className="text-[#68A04E]">{pkg?.Repository}</Link></div>

                    <div className="flex gap-2 my-1">
                        <Input type="text" placeholder="Transfer to process or address" onChange={(e) => setTransferAddress(e.target.value)} />
                        {address ? <Button onClick={transferOwnership}>Transfer Ownership</Button> : <Button onClick={connectWallet}>Connect Wallet</Button>}
                    </div>
                </TabsContent>
                <TabsContent value="install">
                    <div className="flex flex-col p-5">Installation command <code className="bg-white mt-3 p-3 rounded-[16px] pointer-events-auto">APM.install("{pkg?.Vendor == "@apm" ? "" : pkg?.Vendor + "/"}{pkg?.Name}{version && (version == "latest" ? "" : "@" + version)}")</code></div>
                </TabsContent>
                <TabsContent value="versions" className="flex flex-col-reverse gap-2">
                    {
                        pkg?.Versions?.map((v, i) => {
                            let endpoint = "/pkg?name="
                            if (pkg?.Vendor) endpoint += `${pkg?.Vendor}/`
                            if (pkg?.Name) endpoint += pkg?.Name
                            endpoint += `@${v.Version}`

                            return <Link href={endpoint} key={i} className="p-4 font-mono bg-white rounded-[16px] text-sm md:text-base truncate overflow-scroll">
                                <div>{v.Version} | {v.Installs} installs | <span className="text-xs">{v.PkgID}</span></div>
                            </Link>
                        })
                    }
                </TabsContent>
            </div>
        </Tabs>
    </div>
        <Footer />
    </>
}