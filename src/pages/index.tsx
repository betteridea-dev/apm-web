import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

import Registry from "@/components/registry";
import Publish from "@/components/publish";
import Guide from "@/components/guide";
import Footer from "@/components/footer";
import Image from "next/image";

import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="min-h-screen !bg-white">
        <Tabs defaultValue="explore" className="w-full flex flex-col items-center p-5 md:p-10 md:px-24">
          <div className="flex flex-col items-center justify-center relative w-full">
            <Link href="/" className="md:absolute left-0 p-5 md:p-0 flex gap-3 items-center text-xl"><Image alt="logo" src={"/icon.svg"} width={35} height={35} /> APM</Link>
            <TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit">
              <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Registry</TabsTrigger>
              <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
              <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
            </TabsList>
          </div>
          <div className="my-10 w-full h-full">
            <TabsContent value="explore"><Registry /></TabsContent>
            <TabsContent value="publish"><Publish /></TabsContent>
            <TabsContent value="guide"><Guide /></TabsContent>
          </div>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
