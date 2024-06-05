import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Footer from "@/components/footer"
import Link from "next/link"
import { Dispatch, SetStateAction, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { connect, createDataItemSigner } from "@permaweb/aoconnect"
import { APM_ID } from "@/utils/ao-vars"
import { ReloadIcon } from "@radix-ui/react-icons"
import Image    from "next/image"
import betterideaSVG from "@/assets/betteridea.svg"

function TextInput({ placeholder, onChange, icon }: {
    placeholder: string,
    onChange: Dispatch<SetStateAction<string>>,
    icon: React.ReactNode
}) {
    return <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center">
        <div>{icon}</div>
        <input className="outline-none w-full bg-transparent text-[#666]" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
}

export default function NewVendor() {
    const [address, setAddress] = useState<string>("")
    const [vendorName, setVendorName] = useState<string>("")
    const [registering, setRegistering] = useState<boolean>(false)


    async function connectWallet() {
        await window.arweaveWallet.connect(["SIGN_TRANSACTION", "ACCESS_ADDRESS"])
        const addr = await window.arweaveWallet.getActiveAddress()
        setAddress(addr)
        toast.info(`Conencted to ${addr}`)
    }

    async function onRegister() {
        //checks
        if (!vendorName) return toast.error("Vendor name is required")
        if (!vendorName.match(/^@[a-z]+$/i)) return toast.error("Vendor name should only contain alphabetical characters, and must start with @")
        if (vendorName.length <4) return toast.error("Vendor name should be atleast 3 characters long")
        if(vendorName.length > 20) return toast.error("Vendor name should be less than 20 characters long")
        
        const ao = connect()

        setRegistering(true)
        const m_id = await ao.message({
            process: APM_ID,
            tags: [{ name: "Action", value: "RegisterVendor" }],
            data: JSON.stringify({ Name: vendorName }),
            signer: createDataItemSigner(window.arweaveWallet)
        })

        const res = await ao.result({
            process: APM_ID,
            message: m_id
        })

        setRegistering(false)
        console.log(res)
        const { Messages, Output } = res
        if (Messages.length == 0) {
            toast.error(Output.data)
        } else {
            try {
                console.log(Messages[0].Data)
                toast.success(Messages[0].Data + ". Redirecting to homepage in 3")
                setTimeout(() => {
                    window.location.href = "/"
                }, 3000)
            }
            catch (e) {
                console.error(e)
            }
        }
    }

    return <>
        <main className="min-h-screen">
            <title>New Vendor | APM | BetterIDEa</title>
            <Tabs defaultValue="" value="" className="w-full flex flex-col items-center p-5 md:p-10 md:px-24">
                <div className="flex flex-col items-center justify-center relative w-full">
                    <Link href="/" className="md:absolute left-0 p-5 md:p-0 flex gap-3 items-center text-xl"><Image alt="logo" src={"/icon.svg"} width={35} height={35} /> APM (beta)</Link>
                    <Link href="/"><TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit">
                        <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Registry</TabsTrigger>
                        <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
                        <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
                    </TabsList>
                    </Link>
                </div>
                <div className="my-10 w-full h-full flex flex-col gap-5">
                    <div className="text-3xl font-bold">
                        New Vendor
                    </div>
                    A vendor name allows you to publish packages under a common name (e.g. @betteridea/codecell). This name is unique and can't be changed once registered.
                        <TextInput placeholder="Vendor Name" icon="🏷️" onChange={setVendorName}/>
                    {address ? <Button disabled={registering} className="bg-[#666]" onClick={onRegister}>{registering && <ReloadIcon className="animate-spin mr-2" />} Register Vendor</Button> : <Button className="bg-[#666]" onClick={connectWallet}>Connect Wallet</Button>}
                </div>
            </Tabs>
        </main>
        <Footer />
    </>
}