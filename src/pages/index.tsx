import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"

import Registry from "@/components/registry";
import Publish from "@/components/publish";
import Guide from "@/components/guidex";
import Footer from "@/components/footer";

// import { DM_Sans} from "next/font/google";
// const dmSane = DM_Sans({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
    <main className="min-h-screen">
      <Tabs defaultValue="explore" className="w-full flex flex-col items-center p-5 md:p-10 md:px-24">
        <div className="flex flex-col items-center justify-center relative w-full">
          <div className="md:absolute left-0 p-5 md:p-0">APM (beta)</div>
          <TabsList className="bg-[#EEEEEE] w-fit rounded-full h-fit">
              <TabsTrigger value="explore" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Registry</TabsTrigger>
              <TabsTrigger value="publish" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Publish Package</TabsTrigger>
              <TabsTrigger value="guide" className="rounded-full p-3 px-4 data-[state=active]:bg-[#68A04E] data-[state=active]:text-white">Guide</TabsTrigger>
          </TabsList>
        </div>
        <div className="my-10 w-full h-full">
          <TabsContent value="explore"><Registry/></TabsContent>
          <TabsContent value="publish"><Publish/></TabsContent>
          <TabsContent value="guide"><Guide/></TabsContent>
        </div>
      </Tabs>
    </main>
      <Footer />
    </>
  );
}
