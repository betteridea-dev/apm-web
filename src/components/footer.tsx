import { APM_ID } from "@/utils/ao-vars";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import Image from "next/image";

import permanentSVG from "@/assets/permanent.svg";

export default function Footer() {
     return   <footer className="bg-[#68A04E] p-10 text-white flex flex-col gap-5 justify-center md:flex-row md:justify-between items-center">
         <div>
             <Link href="https://discord.gg/nm6VKUQBrA" target="_blank" className="flex items-center">
                 <DiscordLogoIcon className="w-8 h-8 mr-2" />
                 Made with ❤️ by BetterIDEa 
             </Link>
        </div>
         <div className="flex flex-col md:flex-row gap-3 items-center">
             <div className="text-center md:text-right">APM ID <pre className="text-sm">{ APM_ID}</pre></div>
             <Link href="https://arweave.org" target="_blank">
                 <Image src={permanentSVG} alt="permanent" width={120} height={100} />
             </Link>
         </div>
    </footer>
}