import { Input } from "@/components/ui/input"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import Image from "next/image"
import Link from "next/link"

import betterideaSVG from "@/assets/betteridea.svg"
import learnSVG from "@/assets/learn.svg"

function ExploreItem({ title, description, link, icon }:{ title: string, description: string, link: string, icon?:React.ReactNode }) {
    return <Link href={link} target="_blank"
        className="bg-white p-5 flex flex-col gap-2 rounded-[16px] hover:scale-105 hover:shadow-lg transition-all duration-200">
        <div className="font-medium text-xl flex items-center gap-2">{ icon} {title}</div>
        <div className="text-sm">{description}</div>
    </Link>
}

export default function Registry() {
    return <div className="grid grid-cols-1 md:grid-cols-5 gap-5 outline-none">
        <div className="col-span-3">
            <div><span className="text-xl font-bold p-5">Registry</span> Find published packages</div>
            <div className="bg-[#EEE] p-3 rounded-[16px] flex gap-2 items-center my-5">
                <MagnifyingGlassIcon height={20} width={20} className="stroke-[#666] mx-2"/>
                <input className="outline-none w-full bg-transparent text-[#666]" placeholder="Search" />
            </div>
            <div>

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