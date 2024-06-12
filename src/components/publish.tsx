import { useState, useEffect, Dispatch, SetStateAction } from "react"

import { CodeIcon, FileIcon, FileTextIcon, IdCardIcon, InfoCircledIcon, Link1Icon, PersonIcon, ReloadIcon, TimerIcon, VercelLogoIcon } from "@radix-ui/react-icons"
import { Button } from "./ui/button"
import { toast } from "sonner"

import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { APM_ID, Package, Tag } from "@/utils/ao-vars"
import Link from "next/link"


function TextInput({defaultValue, placeholder, onChange, icon }: {
    defaultValue:string,
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

export default function Publish() {
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
                { name: "Quantity", value: toUpdate ?'10000000000': '100000000000'}
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
            if(Output.data) return toast.error(Output.data)
        }

        for (let i = 0; i < Messages.length; i++) {
            const tags = Messages[i].Tags
            tags.forEach((tag:Tag,_:number) => {
                console.log(tag.name, tag.value)
                if (tag.name == "Result" && tag.value == "success") {
                    toast.success("Package published successfully. Opening package page")
                    setTimeout(() => {
                        window.open(`/pkg?id=${m_id}`, "_blank")
                        }, 3000)
                }else if(tag.name == "Result" && tag.value == "error"){
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
            data: `${vendorName||"@apm"}/${packageName}`,
        })
        // console.log(res)
        const { Messages, Output } = res
        console.log(Messages)
        if (Messages.length == 0) {
            // toast.error(Output.data)
            setToUpdate(false)
        } else {
            try {
                const data:Package = JSON.parse(Messages[0].Data)
                if(address&&(data.Owner != address)) return toast.error("You are not the owner of this package")
                toast.info("Package already exists. You can update it")
                setToUpdate(true)
                setShortDescription(data.Description)
                setRepositoryUrl(data.RepositoryUrl)
                setVendorName(data.Vendor)
                setVersion(data.Version+" (increment to update)")
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
        sessionStorage.setItem("load-data-publish",JSON.stringify(setTimeout(() => {
            loadDataIfAlreadyPublished()
        }, 100)))
        return () => clearTimeout(JSON.parse(sessionStorage.getItem("load-data-publish") as string))
    }, [packageName, vendorName])


    return <div>
        <title>Publish | APM | BetterIDEa</title>
        <div className="mb-5"><span className="text-xl font-bold p-5">{toUpdate?"Update":"Publish"}</span> {toUpdate?"Update an existing package":"Publish your own package"} <span className="mx-5 truncate">(needs {toUpdate?"1":"10"} $NEO)</span></div>
        <div className="flex flex-col gap-4">
            <TextInput defaultValue={packageName} placeholder="Package name" onChange={setPackageName} icon={<IdCardIcon width={25} height={25} />} />
            <TextInput defaultValue={vendorName} placeholder="Vendor name (optional - default @apm)" onChange={setVendorName} icon={<PersonIcon width={25} height={25} />} />
            <span className="text-sm -mt-4 -my-2 ml-6">To get a vendor name, <Link href="/new-vendor" className="text-[#68A04E]">visit this page</Link></span>
            <TextInput defaultValue={version}  placeholder={toUpdate?"Please increment version number":"Version (major.minor.patch - default 1.0.0)"} onChange={setVersion} icon={<TimerIcon width={25} height={25} />} />
            <TextInput defaultValue={shortDescription} placeholder="Short Description" onChange={setShortDescription} icon={<InfoCircledIcon width={25} height={25} />} />
            <FileInput placeholder="Upload README.md" allow=".md" onChange={setReadme} icon={<FileTextIcon width={25} height={25} />} />
            <FileInput placeholder="Upload main.lua" allow=".lua" onChange={setMain} icon={<CodeIcon width={25} height={25} />} />
            <TextInput defaultValue={repositoryUrl} placeholder="Repository Url" onChange={setRepositoryUrl} icon={<Link1Icon width={25} height={25} />} />
            
            {address ? <Button className="bg-[#666]" disabled={publishing} onClick={onPublishClicked}> {publishing && <ReloadIcon className="animate-spin mr-2" />}{toUpdate ? "Update (1 $NEO)" :"Publish (10 $NEO)"}</Button> : <Button className="bg-[#666]" onClick={connectWallet}>Connect Wallet</Button>}
        </div>
    </div>
}