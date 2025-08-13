import Markdown from "markdown-to-jsx";
import Link from "next/link";

export default function Guide() {
    return <div className="">
        <title>Guide | APM | BetterIDEa</title>
        <div className="mb-5"><span className="text-3xl font-bold p-5">Guide</span> for publishing packages</div>
        <div className="flex flex-col gap-10 py-10">
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 1: Install APM CLI TOOL</div>
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">{`npm install -g apm-tool`}</Markdown>
                You can run the interactive menu by just running
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">{`apm

-- or if you dont want to install it globally

npx apm-tool`}</Markdown>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 2: Initialise an APM package</div>
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">apm init</Markdown>
                and enter all the details asked for, in the terminal
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 3: Prepare package source code</div>
                <div className="text-lg">Put the source code for your package in lua files and make sure the main file is set inside apm.json</div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Step 4: Publish the package</div>
                Make sure you have a wallet file to use for publishing, then run:
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">apm publish</Markdown>
                it takes all details from the apm.json file and ask for the wallet file path if not found in the apm.json file.<br /><br />
                If you dont want to puslish from the cli using a wallet file, you can also publish from the web by running
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">apm bundle</Markdown>
                which will create a dist folder which you can drag and drop in the web publisher<br /><br />
                Note: You may also register a vendor name before publishing a package to publish under a custom vendor name instead of the default @apm
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">apm register-vendor</Markdown>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Voila! you just published a package to the permaweb</div>
                <div className="text-lg">You can install the package by running the following command in your ao process</div>
                <Markdown className="markdown bg-[#f6f6f6] border border-[#e7e7e7] p-2 rounded-[12px] px-4 font-mono">
                    {`.load-blueprint apm

apm.install "package_name"`}
                </Markdown>
            </div>
            <div className="flex flex-col gap-2">
                <div className="text-xl font-bold">Updating the package</div>
                <div className="text-lg">To update the package, just increment the version in the apm.json file and re publish the package</div>
                Note: You can easily increment the version by running the following command similar to npm
                <Markdown className="markdown bg-gray-100 border p-2 rounded-lg px-4 font-mono">apm version major|minor|patch</Markdown>
            </div>

        </div>
        {/* support */}
        <div className="flex flex-col gap-2 my-5">
            <div className="text-xl font-bold">Need help?</div>
            <div className="text-lg">You can reach out to us at on our <Link href="https://discord.gg/nm6VKUQBrA" className="text-[#68A04E] font-bold" target="_blank">discord server</Link></div>
            <div className="text-lg">We are always happy to help you out</div>
        </div>
    </div>
}