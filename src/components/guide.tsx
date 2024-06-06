import Markdown from "markdown-to-jsx";
import Link from "next/link";

export default function Guide() {
    return <div className="">
        <title>Guide | APM | BetterIDEa</title>
        <div className="mb-5"><span className="text-3xl font-bold p-5">Guide</span> for publishing packages</div>
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 1: Build a package</div>
                <div className="text-lg">Put the source code for your package in a <code>main.lua</code> file</div>
                    <div className="text-lg">Also make sure you have a readme.md file handy</div>
                <div className="bg-[#EEEEEE] p-2 px-4 rounded-lg text-lg">
                    <Markdown className="markdown">{`
\`\`\`lua
-- Sample package structure
local M = {}

function M.hello()
    return "Hello, world!"
end

return M
\`\`\`
                    `}</Markdown>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 2: Publish the package</div>
                <div className="text-lg">Click on the Publish Package tab and start filling in details about your package</div>
                <div className="text-lg">You will need to provide a <strong>name, description, readme file, package source and a repo url</strong> for your package.</div>
                <div className="text-lg">Default vendor name is '@apm' if you donot want to publish under a custom name and default version number is 1.0.0 if you are publishing for the first time</div>
                <div className="text-lg">You can provide a custom version number (x.y.z) if you are updating an existing package</div>
                <div className="text-lg">You can also provide a custom vendor name if you have registered one. To register a new vendor name, visit <Link href="/new-vendor" className="text-[#68a04e] font-bold">this page</Link></div>

            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 3: Hit the publish button</div>
                <div className="text-lg font-medium"><strong>10 Test NEO ($TNEO) tokens</strong> must be burnt to publish a new package or register a vendor name, after which <strong>1 $TNEO</strong> is burnt to publish future updates to existing packages.<br /> To get $TNEO, join our <Link href="https://discord.gg/nm6VKUQBrA" className="text-[#68a04e] font-bold">discord</Link> and tell us about the package you wish to publish.</div>
                <div className="text-lg">The publisher will check for the input details and let you know if the package got published.</div>
                <div className="text-lg">In case of any errors, you will have to fix your entered data.</div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 4: Explore the registry</div>
                <div className="text-lg">You can now see your package in the registry tab</div>
                <div className="text-lg">You can also see the details of your package by clicking on the package card</div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 5: Install the package</div>
                <div className="text-lg">You can install the package by running the following command in your project</div>
                <div className="bg-[#EEEEEE] p-2 px-4 rounded-lg text-lg overflow-scroll">
                    <Markdown className="markdown">{`
\`\`\`lua
APM.install("@vendor_name/package_name@version_number_or_latest")
\`\`\`
                    `}</Markdown>
                </div>
            </div>
            {/* support */}
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Need help?</div>
                <div className="text-lg">You can reach out to us at on our <Link href="https://discord.gg/nm6VKUQBrA" className="text-[#68A04E] font-bold" target="_blank">discord server</Link></div>
                <div className="text-lg">We are always happy to help you out</div>
            </div>
        </div>
    </div>
}