import fs from 'fs'
import dotenv from 'dotenv'
import { execSync } from 'child_process';
import { WarpFactory, defaultCacheOptions } from "warp-contracts";
import Arweave from "arweave";

dotenv.config()

const ANT = "aXJmbLDKLMTnmjyhvEcpML0nI1GZaNQVIGahTWX5mLw"
const SUBDOMAIN = "apm"

const jwk = JSON.parse(Buffer.from(process.env.ANT_WALLET64, "base64").toString("utf-8"));
// console.log(jwk)
const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
});
const warp = WarpFactory.forMainnet(defaultCacheOptions, true, arweave);

const contract = warp.contract(ANT).connect(jwk);


const foo = (err, stdout, stderr) => {
    if (err) {
        console.log(err)
        return
    }
    console.log(stdout)
    console.log(stderr)
}

execSync(`cp ${process.env.WALLET_PATH} ./wallet.json`)
execSync(`rm -rf ./out/manifest.json`)

const timestampString = new Date().toString().replace(/:/g, "-").replace(/\./g, "-")
console.log("Creating Folder...")
execSync(`ardrive create-folder -w ./wallet.json -n "${timestampString}" -F ${process.env.ROOT_EID} ${process.env.TURBO == "YES" && "--turbo"} > ./create-folder-output.json`)
const createOutput = JSON.parse(fs.readFileSync('./create-folder-output.json'))
const folderEid = createOutput.created[0].entityId
console.log("Folder created with EID: " + folderEid)

while (true) {
    try {
        execSync(`ardrive folder-info --folder-id "${folderEid}"`)
        break
    } catch (err) {
        console.log("ArDrive folder has not yet synced. Sleeping for 5 seconds...")
        execSync(`sleep 5`)
    }
}

console.log("Uploading...")
const uploadOutput = JSON.parse(execSync(`cd ./out && ardrive upload-file -w ../wallet.json --local-path ./ -F "${folderEid}" ${process.env.TURBO == "YES" ? "--turbo" : ""}`))
const totalFiles = uploadOutput.created.length
console.log(uploadOutput)
console.log(`Uploaded ${totalFiles} files`)
const childFolderEid = uploadOutput.created[0].entityId

// while (true) {
//     try {
//         execSync(`ardrive folder-info --folder-id "${childFolderEid}"`)
//         break
//     } catch (err) {
//         console.log("ArDrive folder has not yet synced. Sleeping for 5 seconds...")
//         execSync(`sleep 5`)
//     }
// }

while (true) {
    const listedFiles = JSON.parse(execSync(`ardrive list-folder -F "${folderEid}"`).toString()).length
    // if (listedFiles == totalFiles) {
    if (listedFiles > 0)
        break
    console.log(`ArDrive folder artifacts have not yet synced [${listedFiles}/${totalFiles}]. Sleeping for 5 seconds...`)
    execSync(`sleep 5`)
}


console.log("Creating manifest...")
execSync(`ardrive create-manifest -w ./wallet.json -f '${folderEid}' ${process.env.TURBO == "YES" ? "--turbo" : ""} --dry-run > manifest.json`)

console.log("MANINFEST: ", fs.readFileSync('./manifest.json').toString())

console.log("Modifying manifest...")
const output = JSON.parse(fs.readFileSync('./manifest.json'))

const manifest = output.manifest

manifest.index.path = "index.html"
const paths = manifest.paths

Object.keys(paths).forEach((key) => {
    paths[key.replace("./", "")] = paths[key]
    delete paths[key]
})

console.log(manifest)

fs.writeFileSync('./out/manifest.json', JSON.stringify(manifest, null, 2))

console.log("Uploading manifest...")
execSync(`cd ./out && ardrive upload-file -w ../wallet.json -l ./manifest.json --content-type application/x.arweave-manifest+json -F ${folderEid} ${process.env.TURBO == "YES" ? "--turbo" : ""} > ../out.json`)

const out = JSON.parse(fs.readFileSync('./out.json'))
console.log(out)

const dataTxnId = out.created[0].dataTxId
console.log("deployed at https://arweave.net/" + dataTxnId)


console.log("Updating ANT token...")
contract.writeInteraction({
    function: "setRecord",
    subDomain: SUBDOMAIN,
    transactionId: dataTxnId,
    ttlSeconds: 3600
}).then((tx) => {
    console.log("ANT token updated")
    console.log(tx.originalTxId)
}).catch((err) => {
    console.log(err)
})
