import { useState, useEffect, Dispatch, SetStateAction } from "react"

import { CodeIcon, FileIcon, FileTextIcon, IdCardIcon, InfoCircledIcon, Link1Icon, PersonIcon, ReloadIcon, TimerIcon, VercelLogoIcon } from "@radix-ui/react-icons"
import { Button } from "./ui/button"
import { toast } from "sonner"

import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { Package, Tag } from "@/utils/ao-vars"
import Link from "next/link"
import Dropzone from "react-dropzone"
import { APM_ID as NEW_APM_ID } from "@/utils/ao-vars"

const APM_ID = "UdPDhw5S7pByV3pVqwyr1qzJ8mR8ktzi9olgsdsyZz4"

function TextInput({ defaultValue, placeholder, onChange, icon }: {
    defaultValue: string,
    placeholder: string,
    onChange: Dispatch<SetStateAction<string>>,
    icon: React.ReactNode
}) {
    return <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center">
        <div>{icon}</div>
        <input defaultValue={defaultValue} value={defaultValue} className="outline-none w-full bg-transparent text-[#666]" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
}

function FileInput({ placeholder, onChange, icon, allow }: {
    placeholder: string,
    onChange: Dispatch<SetStateAction<string>>,
    icon: React.ReactNode,
    allow?: string
}) {
    return <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center">
        <div>{icon}</div>
        <label className="min-w-fit" htmlFor={placeholder}>{placeholder}</label>
        <input accept={allow || "*"} type="file" id={placeholder} className="outline-none w-full bg-transparent text-[#666]" placeholder={placeholder} onChange={(e) => {
            if (!e.target.files) return
            const reader = new FileReader()
            reader.readAsText(e.target.files[0])
            reader.onload = (e) => {
                console.log(e.target?.result)
                onChange(e.target?.result as string)
            }
        }} />
    </div>
}

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

        const ao = connect()

        const pkgId = await ao.message({
            process: NEW_APM_ID,
            signer: createDataItemSigner(window.arweaveWallet),
            tags,
            data: JSON.stringify({
                source: bundledSrc,
                readme: readme
            })
        })

        const mRes = await ao.result({
            process: NEW_APM_ID,
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
                setTimeout(() => {
                    window.open(`/pkg?id=${apmConfig.vendor}/${apmConfig.name}`, "_blank")
                }, 1000)
            } else {
                toast.error(`Package publishing failed: ${msg.Data}`)
            }
        } else if (Output.data) {
            toast.error(`Package publishing failed: ${Output.data}`)
        } else {
            toast.error("Package publishing failed")
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
                return <section className="border p-4 rounded-lg px-4 text-center">
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
            apmConfig && <div className="bg-[#f0f0f0] p-3 px-6 rounded-lg flex flex-col gap-2 items-start justify-center my-5">
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
        <Button disabled={!enablePublish} onClick={publish}
            className="mx-auto block my-5 w-[95%]">Publish</Button>
    </div>

}

export function PublishOld() {
    const [packageName, setPackageName] = useState<string>("")
    const [vendorName, setVendorName] = useState<string>("")
    const [version, setVersion] = useState<string>("")
    const [shortDescription, setShortDescription] = useState<string>("")
    const [readme, setReadme] = useState<string>("")
    const [main, setMain] = useState<string>("")
    const [repositoryUrl, setRepositoryUrl] = useState<string>("")
    const [address, setAddress] = useState<string>("")

    const [publishing, setPublishing] = useState<boolean>(false)
    const [toUpdate, setToUpdate] = useState<boolean>(false)

    const ao = connect()

    async function onPublishClicked() {
        // check existence
        if (!packageName) return toast.error("Package name is required")
        if (!shortDescription) return toast.error("Short description is required")
        if (!readme) return toast.error("Readme file is required")
        if (!main) return toast.error("main.lua file is required")
        // check for valid url
        if (repositoryUrl && !repositoryUrl.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i)) return toast.error("Invalid repository url")
        // validate strings with regex
        if (!packageName.match(/^[a-z0-9-_]+$/i)) return toast.error("Package name should only contain alphanumeric characters, dashes and underscores")
        if (vendorName && !vendorName.match(/^@[a-z]+$/i)) return toast.error("Vendor name should only contain alphabetical characters, and must start with @")
        if (version && !version.match(/^\d+\.\d+\.\d+$/)) return toast.error("Version should be in the format major.minor.patch")

        // publish
        const data = {
            Name: packageName,
            Vendor: vendorName || "@apm",
            Version: version || "1.0.0",
            PackageData: {
                Readme: readme,
                // convert readme to hex string
                // Readme: Buffer.from(readme).toString('hex'),
                Description: shortDescription,
                Main: "main.lua",
                Dependencies: [],
                RepositoryUrl: repositoryUrl,
                Items: [
                    {
                        meta: { name: "main.lua" },
                        data: main,
                        // convert main to hex string
                        // data: Buffer.from(main).toString('hex')
                    }
                ],
                Authors: []
            }
        }
        console.log("publishing", data)

        setPublishing(true)
        const m_id = await ao.message({
            process: APM_ID,
            data: JSON.stringify(data),
            tags: [
                { name: "Action", value: "APM.Publish" },
                { name: "Quantity", value: toUpdate ? '10000000000' : '100000000000' }
            ],
            signer: createDataItemSigner(window.arweaveWallet)
        })
        console.log(m_id)

        const res = await ao.result({
            process: APM_ID,
            message: m_id
        })
        setPublishing(false)
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
                    toast.success("Package published successfully. Opening package page")
                    setTimeout(() => {
                        window.open(`/pkg?id=${m_id}`, "_blank")
                    }, 3000)
                } else if (tag.name == "Result" && tag.value == "error") {
                    toast.error("Error while publishing")
                }
            })
        }
    }

    async function loadDataIfAlreadyPublished() {
        // check if package is already published
        // if so, load the data
        const res = await ao.dryrun({
            process: APM_ID,
            tags: [{ name: "Action", value: "APM.Info" }],
            data: `${vendorName || "@apm"}/${packageName}`,
        })
        // console.log(res)
        const { Messages, Output } = res
        console.log(Messages)
        if (Messages.length == 0) {
            // toast.error(Output.data)
            setToUpdate(false)
        } else {
            try {
                const data: Package = JSON.parse(Messages[0].Data)
                if (address && (data.Owner != address)) return toast.error("You are not the owner of this package")
                toast.info("Package already exists. You can update it")
                setToUpdate(true)
                setShortDescription(data.Description)
                setRepositoryUrl(data.Repository)
                setVendorName(data.Vendor)
                setVersion(data.Version + " (increment to update)")
            } catch (e) {
                setToUpdate(false)
                console.error(e)
            }
        }
    }

    async function connectWallet() {
        await window.arweaveWallet.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"])
        const addr = await window.arweaveWallet.getActiveAddress()
        setAddress(addr)
        toast.info(`Conencted to ${addr}`)
    }

    useEffect(() => {
        if (!packageName) return
        sessionStorage.setItem("load-data-publish", JSON.stringify(setTimeout(() => {
            loadDataIfAlreadyPublished()
        }, 100)))
        return () => clearTimeout(JSON.parse(sessionStorage.getItem("load-data-publish") as string))
    }, [packageName, vendorName])

    return <div>
        <title>Publish | APM | BetterIDEa</title>
        <div className="mb-5"><span className="text-xl font-bold p-5">{toUpdate ? "Update" : "Publish"}</span> {toUpdate ? "Update an existing package" : "Publish your own package"} <span className="mx-5 truncate">(needs {toUpdate ? "1" : "10"} $NEO)</span></div>
        <div className="flex flex-col gap-4">
            <TextInput defaultValue={packageName} placeholder="Package name" onChange={setPackageName} icon={<IdCardIcon width={25} height={25} />} />
            <TextInput defaultValue={vendorName} placeholder="Vendor name (optional - default @apm)" onChange={setVendorName} icon={<PersonIcon width={25} height={25} />} />
            <span className="text-sm -mt-4 -my-2 ml-6">To get a vendor name, <Link href="/new-vendor" className="text-[#68A04E]">visit this page</Link></span>
            <TextInput defaultValue={version} placeholder={toUpdate ? "Please increment version number" : "Version (major.minor.patch - default 1.0.0)"} onChange={setVersion} icon={<TimerIcon width={25} height={25} />} />
            <TextInput defaultValue={shortDescription} placeholder="Short Description" onChange={setShortDescription} icon={<InfoCircledIcon width={25} height={25} />} />
            <FileInput placeholder="Upload README.md" allow=".md" onChange={setReadme} icon={<FileTextIcon width={25} height={25} />} />
            <FileInput placeholder="Upload main.lua" allow=".lua" onChange={setMain} icon={<CodeIcon width={25} height={25} />} />
            <TextInput defaultValue={repositoryUrl} placeholder="Repository Url" onChange={setRepositoryUrl} icon={<Link1Icon width={25} height={25} />} />

            {address ? <Button className="bg-[#666]" disabled={publishing} onClick={onPublishClicked}> {publishing && <ReloadIcon className="animate-spin mr-2" />}{toUpdate ? "Update (1 $NEO)" : "Publish (10 $NEO)"}</Button> : <Button className="bg-[#666]" onClick={connectWallet}>Connect Wallet</Button>}
        </div>
    </div>
}