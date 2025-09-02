import { useState, useEffect, Dispatch, SetStateAction } from "react"

import { CodeIcon, FileIcon, FileTextIcon, IdCardIcon, InfoCircledIcon, Link1Icon, PersonIcon, ReloadIcon, TimerIcon, VercelLogoIcon } from "@radix-ui/react-icons"
import { Button } from "./ui/button"
import { toast } from "sonner"

import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { Package, Tag } from "@/utils/ao-vars"
import Link from "next/link"
import Dropzone from "react-dropzone"
import { APM_ID } from "@/utils/ao-vars"
import { useLocalStorage } from "usehooks-ts"
import { useRouter } from "next/router"

export type APMConfigJSON = {
    ["$schema"]: string
    name: string
    vendor: string
    description: string
    wallet?: string
    main: string
    version: string
    keywords: string[]
    authors?: {
        address: string
        name: string
        email: string
        url: string
    }[]
    repository: string
    license?: string
    dependencies?: {
        [key: string]: {
            version: string
        }
    },
    warnings?: {
        modifiesGlobalState: boolean
        installMessage: string
    }
}

export default function Publish() {
    const [files, setFiles] = useState<File[]>([])
    const [enablePublish, setEnablePublish] = useState<boolean>(false)
    const [apmConfig, setConfig] = useState<APMConfigJSON>()
    const [bundledSrc, setBundledSrc] = useState<string>("")
    const [readme, setReadme] = useState<string>("")
    const [publishing, setPublishing] = useState<boolean>(false)
    const [cuUrl] = useLocalStorage("apm-cu-url", "https://cu.ardrive.io", { initializeWithValue: true })
    const router = useRouter()

    useEffect(() => {
        if (files.length == 3) {
            const apmJson = files.find(file => file.name.toLowerCase() == "apm.json")
            const bundledLua = files.find(file => file.name.toLowerCase() == "bundled.lua")
            const readmeMd = files.find(file => file.name.toLowerCase() == "readme.md")

            if (!(apmJson && bundledLua && readmeMd)) return

            const reader1 = new FileReader()
            reader1.readAsText(apmJson)
            reader1.onload = (e) => {
                const apmConfig = JSON.parse(e.target?.result as string)
                console.log(apmConfig)
                if (!apmConfig.name) return toast.error("Package name is required")
                if (!apmConfig.vendor) return toast.error("Vendor is required")
                if (!apmConfig.version) return toast.error("Version is required")
                if (!apmConfig.description) return toast.error("Description is required")
                if (!apmConfig.repository) return toast.error("Repository is required")

                if (apmConfig.warnings) {
                    apmConfig.warnings = {
                        modifiesGlobalState: apmConfig.warnings.modifiesGlobalState || false,
                        installMessage: apmConfig.warnings.installMessage || ""
                    }
                } else {
                    apmConfig.warnings = {
                        modifiesGlobalState: false,
                        installMessage: ""
                    }
                }
                setConfig(apmConfig)
            }

            const reader2 = new FileReader()
            reader2.readAsText(bundledLua)
            reader2.onload = (e) => {
                setBundledSrc(e.target?.result as string)
            }

            const reader3 = new FileReader()
            reader3.readAsText(readmeMd)
            reader3.onload = (e) => {
                setReadme(e.target?.result as string)
            }

        }
    }, [files])

    useEffect(() => {
        if (apmConfig && bundledSrc && readme) {
            setEnablePublish(true)
        } else {
            setEnablePublish(false)
        }
    }, [apmConfig, bundledSrc, readme])

    async function publish() {
        if (!apmConfig || !bundledSrc || !readme) return
        console.log(apmConfig, bundledSrc, readme)

        const tags = [
            { name: "Action", value: "APM.Publish" },
            { name: "Name", value: apmConfig.name },
            { name: "Vendor", value: apmConfig.vendor },
            { name: "Version", value: apmConfig.version },
            { name: "Description", value: apmConfig.description },
            { name: "Repository", value: apmConfig.repository || "" },
            { name: "License", value: apmConfig.license || "" },
            { name: "Dependencies", value: JSON.stringify(apmConfig.dependencies || {}) },
            { name: "Warnings", value: JSON.stringify(apmConfig.warnings || {}) },
            { name: "Keywords", value: JSON.stringify(apmConfig.keywords || []) },
            { name: "Authors", value: JSON.stringify(apmConfig.authors || []) },
            // convert bundledSrc and Readme to hex encoded string
            // {
            //     name: "Data", value: JSON.stringify({
            //         bundle: Buffer.from(bundledSrc).toString('hex'),
            //         readme: Buffer.from(readme).toString('hex')
            //     })
            // },
        ]

        setPublishing(true)
        await window.arweaveWallet.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"])
        const addr = await window.arweaveWallet.getActiveAddress()
        if (!addr) {
            setPublishing(false)
            return toast.error("Please connect your wallet")
        }

        try {
            const ao = connect({ CU_URL: cuUrl })

            const pkgId = await ao.message({
                process: APM_ID,
                signer: createDataItemSigner(window.arweaveWallet),
                tags,
                data: JSON.stringify({
                    source: bundledSrc,
                    readme: readme
                })
            })

            const mRes = await ao.result({
                process: APM_ID,
                message: pkgId
            })


            // console.log(mRes)

            const { Messages, Output } = mRes

            if (Messages.length > 0) {
                const msg = Messages[0]
                const tags = msg.Tags as Tag[]
                const Result = tags.find(t => t.name === "Result")?.value
                if (Result === "success") {
                    toast.success("Package published successfully")
                    // clear local state
                    setFiles([])
                    setConfig(undefined)
                    setBundledSrc("")
                    setReadme("")
                    setEnablePublish(false)
                    setPublishing(false)
                    // redirect to package page (same tab)
                    router.push(`/pkg?name=${apmConfig.vendor}/${apmConfig.name}@${apmConfig.version}`)
                } else {
                    setPublishing(false)
                    toast.error(`Package publishing failed: ${msg.Data}`)
                }
            } else if (Output.data) {
                setPublishing(false)
                toast.error(`Package publishing failed: ${Output.data}`)
            } else {
                setPublishing(false)
                toast.error("Package publishing failed")
            }
        } catch (e: any) {
            console.error(e)
            setPublishing(false)
            toast.error(e?.message || "Publishing failed")
        }
    }

    return <div>
        {/* folder dropzone */}
        <title>Publish | APM | BetterIDEa</title>
        <Dropzone
            // accept only markdown, lua and json
            accept={{ 'text/markdown': ['.md'], 'application/json': ['.json'], 'text/x-lua': ['.lua'] }}
            maxFiles={3}
            onDrop={acceptedFiles => {
                console.log(acceptedFiles)
                const allowed = ["apm.json", "bundled.lua", "readme.md"]
                if (acceptedFiles.length == 0) return
                for (let i = 0; i < acceptedFiles.length; i++) {
                    const file = acceptedFiles[i]
                    if (!allowed.includes(file.name.toLowerCase())) {
                        toast.error("Unknown file: " + file.name)
                        return
                    }
                }
                setFiles(acceptedFiles)
            }}>
            {({ getRootProps, getInputProps }) => {
                return <section className="border border-[#e7e7e7] bg-white p-4 rounded-[16px] px-4 text-center">
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        {files.length == 0 ? <p className="text-center">Drop the dist folder containing apm.json, bundle.lua and README.md here</p> : <div>
                            <div className="flex gap-2 justify-evenly items-center">
                                <div className="text-sm">
                                    {files.length} files selected:
                                </div>
                                {files.map(file => <p className="border bg-black/5 rounded-lg px-4" key={file.name}>{file.name}</p>)}
                            </div>
                        </div>}
                    </div>
                </section>
            }}
        </Dropzone>
        {
            apmConfig && <div className="bg-[#f6f6f6] p-4 px-6 rounded-[16px] flex flex-col gap-2 items-start justify-center my-5">
                <div>📦 {apmConfig.vendor}/{apmConfig.name}@{apmConfig.version}</div>
                <div>📝 {apmConfig.description}</div>
                <div>🔗 Repository: <Link href={apmConfig.repository} target="_blank">{apmConfig.repository}</Link></div>
                {apmConfig.keywords.length > 0 && <div>🔑 Keywords: {apmConfig.keywords.join(", ")}</div>}
                {apmConfig.authors && apmConfig.authors?.length > 0 && <div>📄 {apmConfig.authors?.map(author => author.name).join(", ")}</div>}
                {apmConfig.license && <div>📜 License: {apmConfig.license}</div>}
                {apmConfig.dependencies && <div>📦 Dependencies: {Object.keys(apmConfig.dependencies).join(", ") || "NA"}</div>}
                {apmConfig.warnings?.installMessage && <div>⚠️ Install Message: {apmConfig.warnings.installMessage || "NA"}</div>}
                {apmConfig.warnings?.modifiesGlobalState && <div>⚠️ Modifies Global State</div>}

            </div>
        }
        <Button disabled={!enablePublish || publishing} onClick={publish}
            className="mx-auto block my-5 w-[95%]">{publishing && <ReloadIcon className="animate-spin mr-2" />}Publish</Button>
    </div>

}